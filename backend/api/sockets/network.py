"""
Network-related Socket.IO event handlers.

This module handles network mapping, scanning, and related socket events.
It integrates with the network scanner service for all scanning functionality.
"""

import logging
import asyncio
from typing import Dict, Any, List, Optional
import json
import uuid
from datetime import timedelta
from django.utils import timezone
from django.db import close_old_connections
from asgiref.sync import sync_to_async
from api.models.network import NetworkDevice, NetworkConnection, NetworkScan
from api.services.network_scanner import (
    start_scan, cancel_scan, get_scan_status, get_active_scans, 
    get_completed_scans, cleanup_stale_jobs, ScanOptions, ScanType, ScanStatus
)
from .server import sio, session_users
from .auth import get_user_from_sid

# Set up logging
logger = logging.getLogger('socket_server.network')


@sio.event
async def get_network_map(sid: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Get the current network map with devices and connections.
    
    Args:
        sid: Socket.IO session ID of the requester
        data: Optional filter parameters
        
    Returns:
        Dict: Result with status, devices and connections
    """
    try:
        # First check if user is authenticated
        user_id, user = await get_user_from_sid(sid)
        if not user:
            return {
                'status': 'error',
                'message': 'Authentication required'
            }
            
        # Use sync_to_async for database operations
        @sync_to_async
        def fetch_network_data():
            close_old_connections()
            
            # Get all devices that aren't ignored
            devices = NetworkDevice.objects.filter(
                is_ignored=False
            ).order_by('label')
            
            # Get all connections between these devices
            connections = NetworkConnection.objects.filter(
                source__is_ignored=False,
                target__is_ignored=False
            ).select_related('source', 'target')
            
            # Convert to dicts
            device_dicts = [device.to_dict() for device in devices]
            connection_dicts = [connection.to_dict() for connection in connections]
            
            return device_dicts, connection_dicts
            
        devices, connections = await fetch_network_data()
        
        return {
            'status': 'success',
            'devices': devices,
            'connections': connections
        }
    except Exception as e:
        logger.error(f"Failed to get network map: {e}")
        return {'status': 'error', 'message': str(e)}


@sio.event
async def get_network_scan_status(sid: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Get the status of network scans.
    
    Args:
        sid: Socket.IO session ID of the requester
        data: Optional filter parameters
        
    Returns:
        Dict: Result with status and scan information
    """
    try:
        # First check if user is authenticated
        user_id, user = await get_user_from_sid(sid)
        if not user:
            return {
                'status': 'error',
                'message': 'Authentication required'
            }
            
        # Use sync_to_async for database operations
        @sync_to_async
        def fetch_scan_status():
            close_old_connections()
            
            # Check for any active scan
            active_scan = NetworkScan.objects.filter(
                status='in-progress'
            ).order_by('-timestamp').first()
            
            # Get the latest completed/failed scan
            latest_scan = NetworkScan.objects.exclude(
                status='in-progress'
            ).order_by('-timestamp').first()
            
            # Format the results
            result = {
                'active_scan': active_scan.to_dict() if active_scan else None,
                'latest_scan': latest_scan.to_dict() if latest_scan else None,
                'is_scan_active': active_scan is not None,
            }
            
            return result
            
        scan_status = await fetch_scan_status()
        
        return {
            'status': 'success',
            **scan_status
        }
    except Exception as e:
        logger.error(f"Failed to get scan status: {e}")
        return {'status': 'error', 'message': str(e)}


@sio.event
async def update_network_device(sid: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update a network device's information.
    
    Args:
        sid: Socket.IO session ID of the requester
        data: Device data including:
            - id: Device ID
            - label: Device label
            - type: Device type
            - tags: Device tags
            - metadata: Device metadata
            
    Returns:
        Dict: Result with status and updated device
    """
    try:
        # First check if user is authenticated
        user_id, user = await get_user_from_sid(sid)
        if not user:
            return {
                'status': 'error',
                'message': 'Authentication required'
            }
            
        # Extract device data
        device_id = data.get('id')
        if not device_id:
            return {'status': 'error', 'message': 'Missing device ID'}
            
        # Update the device
        @sync_to_async
        def update_device():
            close_old_connections()
            
            try:
                device = NetworkDevice.objects.get(id=device_id)
            except NetworkDevice.DoesNotExist:
                return None
                
            # Update fields if provided
            if 'label' in data:
                device.label = data['label']
                
            if 'type' in data and data['type'] in dict(NetworkDevice.TYPE_CHOICES):
                device.type = data['type']
                
            if 'tags' in data and isinstance(data['tags'], list):
                device.tags = data['tags']
                
            if 'metadata' in data and isinstance(data['metadata'], dict):
                # Update metadata without overriding existing fields
                metadata = device.metadata or {}
                metadata.update(data['metadata'])
                device.metadata = metadata
                
            # Mark as manually updated if this was an auto-discovered device
            if not device.is_manually_added:
                device.is_manually_added = True
                
            device.save()
            return device.to_dict()
            
        updated_device = await update_device()
        
        if not updated_device:
            return {'status': 'error', 'message': 'Device not found'}
            
        # Broadcast the updated device to all clients
        await sio.emit('device_updated', updated_device)
        
        return {
            'status': 'success',
            'device': updated_device,
            'message': 'Device updated successfully'
        }
    except Exception as e:
        logger.error(f"Failed to update device: {e}")
        return {'status': 'error', 'message': str(e)}


@sio.event
async def start_network_scan(sid: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Start a network scan using the network scanner service.
    
    Args:
        sid: Socket.IO session ID of the requester
        data: Optional scan parameters including:
            - scan_type: 'BASIC', 'INTENSE', or 'FULL'
            - ip_range: Optional specific IP range to scan
            - include_ports: Whether to include port scanning (default: true)
            - include_os_detection: Whether to include OS detection (default: false)
            - timeout: Scan timeout in seconds (default: 300)
        
    Returns:
        Dict: Result with status and scan job information
    """
    try:
        # First check if user is authenticated
        user_id, user = await get_user_from_sid(sid)
        if not user:
            return {
                'status': 'error',
                'message': 'Authentication required'
            }
            
        # Parse scan options from request
        scan_options = ScanOptions()
        
        if data:
            # Set scan type
            if 'scan_type' in data:
                scan_type = data['scan_type'].upper()
                if scan_type == 'BASIC':
                    scan_options.scan_type = ScanType.BASIC
                elif scan_type == 'INTENSE':
                    scan_options.scan_type = ScanType.INTENSE
                elif scan_type == 'FULL':
                    scan_options.scan_type = ScanType.FULL
                    
            # Set IP range if provided
            if 'ip_range' in data:
                scan_options.ip_range = data['ip_range']
                
            # Set other options
            if 'include_ports' in data:
                scan_options.include_ports = bool(data['include_ports'])
                
            if 'include_os_detection' in data:
                scan_options.include_os_detection = bool(data['include_os_detection'])
                
            if 'timeout' in data:
                scan_options.timeout = int(data['timeout'])
                
        # Check for active scans first
        active_scans = await get_active_scans()
        if active_scans:
            return {
                'status': 'error',
                'message': 'A scan is already in progress',
                'active_scan': active_scans[0].to_dict()
            }
            
        # Create scan record in database
        @sync_to_async
        def create_scan_record():
            close_old_connections()
            scan = NetworkScan.objects.create(
                status='in-progress',
                scan_method='network_scanner_service',
                ip_range=scan_options.ip_range or 'auto-detected'
            )
            return scan.id, scan.to_dict()
            
        db_scan_id, db_scan_dict = await create_scan_record()
        
        # Start the scan
        logger.info(f"Starting network scan requested by {user_id}")
        scan_job = await start_scan(scan_options)
        
        # Store the job ID in the scan record
        @sync_to_async
        def update_scan_with_job_id(scan_id, job_id):
            close_old_connections()
            try:
                scan = NetworkScan.objects.get(id=scan_id)
                # Store the job ID in metadata
                metadata = scan.metadata or {}
                metadata['job_id'] = job_id
                scan.metadata = metadata
                scan.save(update_fields=['metadata'])
            except NetworkScan.DoesNotExist:
                logger.error(f"Could not find scan record {scan_id} to update with job ID")
        
        await update_scan_with_job_id(db_scan_id, scan_job.id)
        
        # Register progress callback - we'll handle this separately in the next phase
        # For now, just broadcast updates to clients at regular intervals
        asyncio.create_task(monitor_scan_progress(scan_job.id, db_scan_id))
        
        # Return response
        return {
            'status': 'success',
            'message': 'Network scan started successfully',
            'scan': db_scan_dict,
            'job_id': scan_job.id
        }
    except Exception as e:
        logger.error(f"Failed to start network scan: {e}")
        return {'status': 'error', 'message': str(e)}


async def monitor_scan_progress(job_id: str, db_scan_id: str):
    """
    Monitor scan progress and update database record.
    
    Args:
        job_id: Scanner service job ID
        db_scan_id: Database scan record ID
    """
    try:
        while True:
            # Get scan status
            scan_job = await get_scan_status(job_id)
            if not scan_job:
                logger.error(f"Could not find scan job {job_id}")
                break
                
            # If scan is no longer running, save results
            if scan_job.status != ScanStatus.RUNNING:
                await save_scan_results(scan_job, db_scan_id)
                # Broadcast final status
                await sio.emit('scan_progress', {
                    'scan_id': str(db_scan_id),
                    'job_id': job_id,
                    'status': scan_job.status.name,
                    'progress': 100,
                    'message': f"Scan {scan_job.status.name.lower()}",
                    'discovered_devices': scan_job.result.device_count,
                    'is_complete': True
                })
                break
                
            # Update scan status in database
            @sync_to_async
            def update_scan_progress():
                close_old_connections()
                try:
                    scan = NetworkScan.objects.get(id=db_scan_id)
                    scan.discovered_devices = scan_job.result.device_count
                    # Store progress in metadata
                    metadata = scan.metadata or {}
                    metadata['progress'] = scan_job.progress
                    scan.metadata = metadata
                    scan.save()
                    return scan.to_dict()
                except NetworkScan.DoesNotExist:
                    logger.error(f"Could not find scan record {db_scan_id} to update progress")
                    return None
                    
            updated_scan = await update_scan_progress()
            
            # Broadcast progress to all clients
            await sio.emit('scan_progress', {
                'scan_id': str(db_scan_id),
                'job_id': job_id,
                'status': scan_job.status.name,
                'progress': scan_job.progress,
                'message': f"Scanning network ({scan_job.progress}%)",
                'discovered_devices': scan_job.result.device_count,
                'is_complete': False
            })
            
            # Wait before next update
            await asyncio.sleep(1)
    except Exception as e:
        logger.error(f"Error monitoring scan progress: {e}")
        

async def save_scan_results(scan_job, db_scan_id):
    """
    Save scan results to database.
    
    Args:
        scan_job: The completed scan job
        db_scan_id: Database scan record ID
    """
    try:
        # Update scan record
        @sync_to_async
        def update_scan_record():
            close_old_connections()
            try:
                scan = NetworkScan.objects.get(id=db_scan_id)
                
                # Update status
                if scan_job.status == ScanStatus.COMPLETED:
                    scan.status = 'completed'
                elif scan_job.status == ScanStatus.FAILED:
                    scan.status = 'failed'
                    scan.error_message = scan_job.error_message
                elif scan_job.status == ScanStatus.CANCELLED:
                    scan.status = 'failed'
                    scan.error_message = "Scan was cancelled by user"
                else:
                    scan.status = 'failed'
                    scan.error_message = f"Unexpected scan status: {scan_job.status.name}"
                    
                # Update other fields
                scan.discovered_devices = scan_job.result.device_count
                scan.duration = scan_job.result.scan_time
                scan.save()
                
            except NetworkScan.DoesNotExist:
                logger.error(f"Could not find scan record {db_scan_id} to update with results")
                return False
                
            return True
                
        scan_updated = await update_scan_record()
        
        # If scan failed, don't save devices/connections
        if not scan_updated or scan_job.status != ScanStatus.COMPLETED:
            return
            
        # Save discovered devices and connections
        @sync_to_async
        def save_devices_and_connections():
            close_old_connections()
            
            # Dictionary to map job device IDs to database device IDs
            id_mapping = {}
            
            # Save/update devices
            for _, device_data in scan_job.result.devices.items():
                try:
                    # Check if device exists by IP
                    if device_data.get('ip'):
                        device, created = NetworkDevice.objects.get_or_create(
                            ip=device_data['ip'],
                            defaults={
                                'label': device_data.get('label', device_data.get('hostname', 'Unknown')),
                                'type': device_data.get('type', 'other'),
                                'mac': device_data.get('mac'),
                                'hostname': device_data.get('hostname'),
                                'status': device_data.get('status', 'online'),
                                'metadata': device_data.get('metadata', {}),
                                'last_seen': timezone.now()
                            }
                        )
                        
                        # Update existing device if not manually added
                        if not created and not device.is_manually_added:
                            device.label = device_data.get('label', device.label)
                            device.type = device_data.get('type', device.type)
                            device.mac = device_data.get('mac', device.mac)
                            device.hostname = device_data.get('hostname', device.hostname)
                            device.status = device_data.get('status', device.status)
                            
                            # Update metadata without overriding user-added data
                            if device_data.get('metadata'):
                                metadata = device.metadata or {}
                                metadata.update(device_data.get('metadata', {}))
                                device.metadata = metadata
                                
                            device.last_seen = timezone.now()
                            device.save()
                        
                        # Map job device ID to database ID
                        id_mapping[device_data['id']] = str(device.id)
                except Exception as e:
                    logger.error(f"Error saving device {device_data.get('ip')}: {e}")
            
            # Save connections
            for conn_data in scan_job.result.connections:
                try:
                    # Map source and target IDs
                    source_id = id_mapping.get(conn_data['source'])
                    target_id = id_mapping.get(conn_data['target'])
                    
                    if source_id and target_id:
                        # Get or create connection
                        conn, created = NetworkConnection.objects.get_or_create(
                            source_id=source_id,
                            target_id=target_id,
                            defaults={
                                'type': conn_data.get('type', 'wired'),
                                'status': conn_data.get('status', 'active'),
                                'latency': conn_data.get('latency'),
                                'metadata': conn_data.get('metadata', {})
                            }
                        )
                        
                        # Update existing connection
                        if not created:
                            conn.type = conn_data.get('type', conn.type)
                            conn.status = conn_data.get('status', conn.status)
                            conn.latency = conn_data.get('latency', conn.latency)
                            
                            # Update metadata
                            if conn_data.get('metadata'):
                                metadata = conn.metadata or {}
                                metadata.update(conn_data.get('metadata', {}))
                                conn.metadata = metadata
                                
                            conn.save()
                except Exception as e:
                    logger.error(f"Error saving connection: {e}")
        
        await save_devices_and_connections()
        
        # Broadcast network map update to all clients
        await sio.emit('network_map_updated')
        
    except Exception as e:
        logger.error(f"Error saving scan results: {e}")


@sio.event
async def check_scan_status(sid: str) -> Dict[str, Any]:
    """
    Check the status of in-progress scans and clean up any stale ones.
    
    Args:
        sid: Socket.IO session ID of the requester
        
    Returns:
        Dict: Result with status and message
    """
    try:
        # First check if user is authenticated
        user_id, user = await get_user_from_sid(sid)
        if not user:
            return {
                'status': 'error',
                'message': 'Authentication required'
            }
        
        # Clean up stale scans both in database and in scanner service
        # Scanner service stale jobs (30 minutes timeout)
        cleaned_service_jobs = await cleanup_stale_jobs(1800)
        
        # Database stale scans
        @sync_to_async
        def check_scan_status_sync():
            close_old_connections()
            now = timezone.now()
            # A scan is considered stale if it's been in-progress for more than 30 minutes
            cutoff_time = now - timedelta(minutes=30)
            
            # Find and clean up stale scans
            stale_scans = NetworkScan.objects.filter(
                status='in-progress',
                timestamp__lt=cutoff_time
            )
            
            stale_count = 0
            for scan in stale_scans:
                scan.status = 'failed'
                scan.error_message = 'Scan timed out or was interrupted'
                scan.duration = (now - scan.timestamp).total_seconds() if not scan.duration else scan.duration
                scan.save()
                stale_count += 1
                
            # Get count of remaining active scans
            active_count = NetworkScan.objects.filter(status='in-progress').count()
            
            return stale_count, active_count
            
        cleaned_db, remaining = await check_scan_status_sync()
        
        # Get active scans from service
        active_scans = await get_active_scans()
        
        return {
            'status': 'success',
            'cleaned_scans': cleaned_db + cleaned_service_jobs,
            'active_scans': remaining,
            'active_jobs': len(active_scans),
            'message': f"Cleaned {cleaned_db} stale database scans and {cleaned_service_jobs} stale service jobs, {remaining} active scans remain"
        }
    except Exception as e:
        logger.error(f"Failed to check scan status: {e}")
        return {'status': 'error', 'message': str(e)}


@sio.event
async def get_network_scan_results(sid: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get the results of a completed network scan.
    
    Args:
        sid: Socket.IO session ID of the requester
        data: Request data containing:
            - job_id: Optional job ID from the scanner service
            - scan_id: Optional database scan record ID
        
    Returns:
        Dict: Result with status and scan results
    """
    try:
        # First check if user is authenticated
        user_id, user = await get_user_from_sid(sid)
        if not user:
            return {
                'status': 'error',
                'message': 'Authentication required'
            }
            
        job_id = data.get('job_id')
        scan_id = data.get('scan_id')
        
        if not job_id and not scan_id:
            return {
                'status': 'error',
                'message': 'Either job_id or scan_id must be provided'
            }
        
        # If scan_id is provided, try to get the job_id from the database
        if scan_id and not job_id:
            @sync_to_async
            def get_job_id_from_scan():
                close_old_connections()
                try:
                    scan = NetworkScan.objects.get(id=scan_id)
                    metadata = scan.metadata or {}
                    return metadata.get('job_id')
                except NetworkScan.DoesNotExist:
                    return None
                    
            job_id = await get_job_id_from_scan()
        
        # If we have a job_id, get the results from the scanner service
        if job_id:
            scan_job = await get_scan_status(job_id)
            
            if scan_job:
                # Check if the scan is completed
                if scan_job.status == ScanStatus.COMPLETED:
                    return {
                        'status': 'success',
                        'job_id': job_id,
                        'scan_id': scan_id,
                        'scan_time': scan_job.result.scan_time,
                        'device_count': scan_job.result.device_count,
                        'connection_count': scan_job.result.connection_count,
                        'devices': list(scan_job.result.devices.values()),
                        'connections': scan_job.result.connections,
                        'warning': scan_job.result.warning
                    }
                else:
                    return {
                        'status': 'error',
                        'message': f"Scan not completed. Current status: {scan_job.status.name}",
                        'job_status': scan_job.status.name,
                        'progress': scan_job.progress
                    }
            else:
                # Job not found in service, fall back to database
                pass
                
        # If we get here, either job_id wasn't provided or scan wasn't found in service
        # So let's return the data from the database
        @sync_to_async
        def get_scan_results_from_db(scan_id_):
            close_old_connections()
            
            try:
                # Get the scan record
                scan = NetworkScan.objects.get(id=scan_id_)
                
                # Check if scan is completed
                if scan.status != 'completed':
                    return {
                        'status': 'error',
                        'message': f"Scan not completed. Current status: {scan.status}",
                        'db_status': scan.status
                    }
                
                # Get all devices from the latest scan
                devices = NetworkDevice.objects.filter(
                    is_ignored=False
                ).order_by('label')
                
                # Get all connections
                connections = NetworkConnection.objects.filter(
                    source__is_ignored=False,
                    target__is_ignored=False
                ).select_related('source', 'target')
                
                # Convert to dicts
                device_dicts = [device.to_dict() for device in devices]
                connection_dicts = [connection.to_dict() for connection in connections]
                
                return {
                    'status': 'success',
                    'scan_id': str(scan.id),
                    'scan_time': scan.duration,
                    'device_count': scan.discovered_devices,
                    'connection_count': len(connection_dicts),
                    'devices': device_dicts,
                    'connections': connection_dicts
                }
                
            except NetworkScan.DoesNotExist:
                return {
                    'status': 'error',
                    'message': f"Scan with ID {scan_id_} not found"
                }
        
        if scan_id:
            return await get_scan_results_from_db(scan_id)
        else:
            return {
                'status': 'error',
                'message': 'Could not find scan results'
            }
            
    except Exception as e:
        logger.error(f"Failed to get scan results: {e}")
        return {'status': 'error', 'message': str(e)}


@sio.event
async def cancel_network_scan(sid: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Cancel an in-progress network scan.
    
    Args:
        sid: Socket.IO session ID of the requester
        data: Request data containing:
            - job_id: Optional job ID from the scanner service
            - scan_id: Optional database scan record ID
        
    Returns:
        Dict: Result with status and message
    """
    try:
        # First check if user is authenticated
        user_id, user = await get_user_from_sid(sid)
        if not user:
            return {
                'status': 'error',
                'message': 'Authentication required'
            }
            
        job_id = data.get('job_id')
        scan_id = data.get('scan_id')
        
        if not job_id and not scan_id:
            return {
                'status': 'error',
                'message': 'Either job_id or scan_id must be provided'
            }
        
        # If scan_id is provided, try to get the job_id from the database
        if scan_id and not job_id:
            @sync_to_async
            def get_job_id_from_scan():
                close_old_connections()
                try:
                    scan = NetworkScan.objects.get(id=scan_id)
                    metadata = scan.metadata or {}
                    return metadata.get('job_id')
                except NetworkScan.DoesNotExist:
                    return None
                    
            job_id = await get_job_id_from_scan()
        
        # If we have a job_id, cancel it in the scanner service
        if job_id:
            cancelled = await cancel_scan(job_id)
            
            if cancelled:
                # Update the database record
                @sync_to_async
                def update_scan_record():
                    close_old_connections()
                    
                    if scan_id:
                        try:
                            scan = NetworkScan.objects.get(id=scan_id)
                            scan.status = 'failed'
                            scan.error_message = 'Scan was cancelled by user'
                            scan.save()
                            return True
                        except NetworkScan.DoesNotExist:
                            return False
                    return False
                
                await update_scan_record()
                
                return {
                    'status': 'success',
                    'message': 'Scan cancelled successfully'
                }
            else:
                return {
                    'status': 'error',
                    'message': 'Could not cancel scan, it may have already completed or been cancelled'
                }
        else:
            # If no job_id is available, update the database record directly
            @sync_to_async
            def cancel_scan_in_db():
                close_old_connections()
                
                if scan_id:
                    try:
                        scan = NetworkScan.objects.get(id=scan_id)
                        
                        if scan.status == 'in-progress':
                            scan.status = 'failed'
                            scan.error_message = 'Scan was cancelled by user'
                            scan.save()
                            return True
                        else:
                            return False
                    except NetworkScan.DoesNotExist:
                        return False
                return False
            
            cancelled = await cancel_scan_in_db()
            
            if cancelled:
                return {
                    'status': 'success',
                    'message': 'Scan cancelled in database, but could not find job to cancel in service'
                }
            else:
                return {
                    'status': 'error',
                    'message': 'Could not cancel scan, it may not exist or already be completed'
                }
            
    except Exception as e:
        logger.error(f"Failed to cancel scan: {e}")
        return {'status': 'error', 'message': str(e)}


@sio.event
async def get_network_topology(sid: str, data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Get the current network topology with device and connection information.
    
    Args:
        sid: Socket.IO session ID of the requester
        data: Optional filter parameters
        
    Returns:
        Dict with network topology data including devices, connections and scan status
    """
    try:
        # First check if user is authenticated
        user_id, user = await get_user_from_sid(sid)
        if not user:
            return {
                'status': 'error',
                'message': 'Authentication required'
            }
            
        # Get network map first
        network_map = await get_network_map(sid, data)
        if network_map.get('status') != 'success':
            return network_map
            
        # Get scan status
        scan_status = await get_network_scan_status(sid, data)
        if scan_status.get('status') != 'success':
            return {
                **network_map,
                'activeScanInProgress': False,
                'lastScan': None
            }
            
        # Combine into a topology response
        topology = {
            'devices': network_map.get('devices', []),
            'connections': network_map.get('connections', []),
            'activeScanInProgress': scan_status.get('is_scan_active', False),
            'lastScan': scan_status.get('latest_scan'),
        }
        
        return topology
    except Exception as e:
        logger.error(f"Failed to get network topology: {e}")
        return {'status': 'error', 'message': str(e)}

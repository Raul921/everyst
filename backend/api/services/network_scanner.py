"""
Network scanner service.

This module provides a clean, decoupled interface for network scanning operations.
It uses asyncio for asynchronous scanning and provides mechanisms for scan recovery.
The service is designed to be independent of specific web frameworks or socket implementations.
"""

import asyncio
import ipaddress
import logging
import time
import socket
import sys
import uuid
from dataclasses import dataclass, field, asdict
from datetime import datetime
from enum import Enum, auto
from typing import Dict, List, Optional, Set, Any, Union, Tuple, Callable, AsyncGenerator
import nmap
import netifaces
from concurrent.futures import ThreadPoolExecutor
from netaddr import IPNetwork, IPAddress

try:
    # Only import scapy if available - allows for partial functionality without it
    from scapy.all import ARP, Ether, srp, IP, ICMP, sr1, TCP
    SCAPY_AVAILABLE = True
except ImportError:
    SCAPY_AVAILABLE = False

# Set up logging
logger = logging.getLogger("network_scanner")

# Constants
MAX_THREADS = 50
SCAN_TIMEOUT = 2
PING_TIMEOUT = 1
TOP_PORTS = 100
MAX_RETRIES = 2
SCAN_RECOVERY_INTERVAL = 60  # seconds
DEFAULT_SCAN_TIMEOUT = 300   # seconds
DEFAULT_SCAN_PROGRESS_INTERVAL = 1  # seconds


class ScanType(Enum):
    """Enum for different scan types with increasing intensity."""
    BASIC = auto()   # Fast ARP + minimal port scan
    INTENSE = auto() # More ports + OS detection
    FULL = auto()    # All ports + detailed service info


class ScanStatus(Enum):
    """Enum for scan status tracking."""
    READY = auto()       # Initialized but not started
    RUNNING = auto()     # Scan is in progress
    COMPLETED = auto()   # Scan completed successfully
    FAILED = auto()      # Scan failed due to error
    CANCELLED = auto()   # Scan was cancelled by user
    TIMED_OUT = auto()   # Scan timed out
    RECOVERING = auto()  # Attempting to recover from a partial scan


@dataclass
class ScanResult:
    """Container for scan result data."""
    devices: Dict[str, Dict[str, Any]] = field(default_factory=dict)
    connections: List[Dict[str, Any]] = field(default_factory=list)
    error: Optional[str] = None
    warning: Optional[str] = None
    scan_time: float = 0.0
    device_count: int = 0
    connection_count: int = 0
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return asdict(self)


@dataclass
class ScanOptions:
    """Container for scan configuration options."""
    scan_type: ScanType = ScanType.BASIC
    ip_range: Optional[str] = None
    subnet: Optional[str] = None
    include_ports: bool = True
    include_os_detection: bool = False
    include_service_detection: bool = False
    max_devices: int = 100
    timeout: int = DEFAULT_SCAN_TIMEOUT
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "scan_type": self.scan_type.name,
            "ip_range": self.ip_range,
            "subnet": self.subnet,
            "include_ports": self.include_ports,
            "include_os_detection": self.include_os_detection,
            "include_service_detection": self.include_service_detection,
            "max_devices": self.max_devices,
            "timeout": self.timeout
        }


@dataclass
class ScanJob:
    """Represents a network scan job with status tracking."""
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    options: ScanOptions = field(default_factory=ScanOptions)
    status: ScanStatus = ScanStatus.READY
    progress: int = 0
    result: ScanResult = field(default_factory=ScanResult)
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    error_message: Optional[str] = None
    partial_results: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert job to dictionary format."""
        return {
            "id": self.id,
            "status": self.status.name,
            "progress": self.progress,
            "options": self.options.to_dict(),
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "error_message": self.error_message,
            "device_count": self.result.device_count,
            "connection_count": self.result.connection_count,
            "scan_time": self.result.scan_time,
        }

    def mark_started(self) -> None:
        """Mark the job as started."""
        self.start_time = datetime.now()
        self.status = ScanStatus.RUNNING
        self.progress = 0

    def mark_completed(self) -> None:
        """Mark the job as completed."""
        self.end_time = datetime.now()
        self.status = ScanStatus.COMPLETED
        self.progress = 100
        self.result.scan_time = (self.end_time - self.start_time).total_seconds()
        self.result.device_count = len(self.result.devices)
        self.result.connection_count = len(self.result.connections)

    def mark_failed(self, error_message: str) -> None:
        """Mark the job as failed."""
        self.end_time = datetime.now()
        self.status = ScanStatus.FAILED
        self.error_message = error_message
        if self.start_time:
            self.result.scan_time = (self.end_time - self.start_time).total_seconds()

    def mark_cancelled(self) -> None:
        """Mark the job as cancelled."""
        self.end_time = datetime.now()
        self.status = ScanStatus.CANCELLED
        if self.start_time:
            self.result.scan_time = (self.end_time - self.start_time).total_seconds()

    def update_progress(self, progress: int) -> None:
        """Update the scan progress."""
        self.progress = min(99, progress)  # Reserve 100 for completion

    def save_partial_result(self, key: str, data: Any) -> None:
        """Save partial scan result for potential recovery."""
        self.partial_results[key] = data
        
    def is_stale(self, timeout_seconds: int = 1800) -> bool:
        """Check if this job is stale (running too long)."""
        if self.status != ScanStatus.RUNNING:
            return False
        if not self.start_time:
            return True  # No start time but running status is definitely stale
        elapsed = (datetime.now() - self.start_time).total_seconds()
        return elapsed > timeout_seconds


class NetworkScanner:
    """
    Network scanner service that provides methods for discovering and analyzing
    network devices and connections.
    
    This class is designed to be standalone and not depend on Django or other
    web frameworks, but can integrate with them using its public interface.
    """
    
    def __init__(self):
        """Initialize the network scanner service."""
        self.active_jobs: Dict[str, ScanJob] = {}
        self.completed_jobs: Dict[str, ScanJob] = {}
        self._running_tasks: Dict[str, asyncio.Task] = {}
        self._cancel_events: Dict[str, asyncio.Event] = {}
        
    async def start_scan(self, options: Optional[ScanOptions] = None) -> ScanJob:
        """
        Start a new network scan with the given options.
        
        Args:
            options: The scan configuration options
            
        Returns:
            The created scan job
        """
        if options is None:
            options = ScanOptions()
            
        # Create a new scan job
        job = ScanJob(options=options)
        self.active_jobs[job.id] = job
        
        # Create a cancellation event
        cancel_event = asyncio.Event()
        self._cancel_events[job.id] = cancel_event
        
        # Start the scan in a background task
        task = asyncio.create_task(
            self._run_scan_job(job.id, cancel_event)
        )
        self._running_tasks[job.id] = task
        
        return job
    
    async def cancel_scan(self, job_id: str) -> bool:
        """
        Cancel a running scan.
        
        Args:
            job_id: The ID of the scan job to cancel
            
        Returns:
            True if the job was cancelled, False if not found or not running
        """
        if job_id not in self.active_jobs:
            return False
            
        job = self.active_jobs[job_id]
        if job.status != ScanStatus.RUNNING:
            return False
            
        # Signal cancellation
        if job_id in self._cancel_events:
            self._cancel_events[job_id].set()
            
        return True
    
    async def get_scan_status(self, job_id: str) -> Optional[ScanJob]:
        """
        Get the status of a scan job.
        
        Args:
            job_id: The ID of the scan job
            
        Returns:
            The scan job or None if not found
        """
        if job_id in self.active_jobs:
            return self.active_jobs[job_id]
        elif job_id in self.completed_jobs:
            return self.completed_jobs[job_id]
        return None
    
    async def get_active_scans(self) -> List[ScanJob]:
        """
        Get all active scan jobs.
        
        Returns:
            List of active scan jobs
        """
        return list(self.active_jobs.values())
    
    async def get_completed_scans(self) -> List[ScanJob]:
        """
        Get all completed scan jobs.
        
        Returns:
            List of completed scan jobs
        """
        return list(self.completed_jobs.values())
    
    async def cleanup_stale_jobs(self, timeout_seconds: int = 1800) -> int:
        """
        Clean up stale jobs that have been running too long.
        
        Args:
            timeout_seconds: The maximum allowed run time in seconds
            
        Returns:
            Number of jobs cleaned up
        """
        stale_jobs = []
        for job_id, job in list(self.active_jobs.items()):
            if job.is_stale(timeout_seconds):
                stale_jobs.append(job_id)
                job.mark_failed("Scan timed out or was stuck")
                
        # Clean up resources for stale jobs
        for job_id in stale_jobs:
            if job_id in self._cancel_events:
                self._cancel_events[job_id].set()
            if job_id in self._running_tasks:
                if not self._running_tasks[job_id].done():
                    self._running_tasks[job_id].cancel()
                    
            # Move to completed jobs
            job = self.active_jobs.pop(job_id, None)
            if job:
                self.completed_jobs[job_id] = job
                
        return len(stale_jobs)
        
    async def register_progress_callback(self, job_id: str, callback: Callable[[ScanJob], None]) -> bool:
        """
        Register a callback for job progress updates.
        
        Args:
            job_id: The ID of the scan job
            callback: The callback function
            
        Returns:
            True if registered successfully, False otherwise
        """
        # This method would be implemented for real-time progress updates
        # For now, it's a placeholder for the API
        return True
        
    # Private methods
        
    async def _run_scan_job(self, job_id: str, cancel_event: asyncio.Event) -> None:
        """
        Run a scan job and handle its lifecycle.
        
        Args:
            job_id: The ID of the scan job
            cancel_event: Event to signal cancellation
        """
        try:
            job = self.active_jobs[job_id]
            job.mark_started()
            
            # Set up progress reporting
            async def progress_updater():
                while not cancel_event.is_set() and job.status == ScanStatus.RUNNING:
                    # This task just ensures we update the job with progress
                    # from the actual scanning task
                    await asyncio.sleep(DEFAULT_SCAN_PROGRESS_INTERVAL)
                    
            # Start progress updater
            progress_task = asyncio.create_task(progress_updater())
            
            # Run the scan with timeout
            try:
                result = await asyncio.wait_for(
                    self._perform_network_scan(job, cancel_event),
                    timeout=job.options.timeout
                )
                job.result = result
                job.mark_completed()
            except asyncio.TimeoutError:
                job.mark_failed(f"Scan timed out after {job.options.timeout} seconds")
            except asyncio.CancelledError:
                job.mark_cancelled()
            except Exception as e:
                job.mark_failed(f"Scan failed: {str(e)}")
                logger.exception("Error during network scan")
                
            # Clean up
            progress_task.cancel()
            
            # Move to completed jobs
            if job_id in self.active_jobs:
                self.completed_jobs[job_id] = job
                del self.active_jobs[job_id]
                
        except Exception as e:
            logger.exception(f"Error in _run_scan_job for job {job_id}: {e}")
        finally:
            # Clear resources
            if job_id in self._cancel_events:
                del self._cancel_events[job_id]
            if job_id in self._running_tasks:
                del self._running_tasks[job_id]
    
    async def _perform_network_scan(self, job: ScanJob, cancel_event: asyncio.Event) -> ScanResult:
        """
        Perform the actual network scanning operations.
        
        Args:
            job: The scan job
            cancel_event: Event to signal cancellation
            
        Returns:
            The scan result
        """
        result = ScanResult()
        
        try:
            # Determine the target subnets
            if job.options.ip_range:
                subnets = [job.options.ip_range]
            elif job.options.subnet:
                subnets = [job.options.subnet]
            else:
                # Auto-discover local subnets
                subnets = await self._get_local_subnets()
                
                # Save partial result for potential recovery
                job.save_partial_result("subnets", subnets)
                
            if not subnets:
                raise ValueError("No valid subnets found for scanning")
                
            # Check if cancelled before starting scan
            if cancel_event.is_set():
                return result
                
            # Phase 1: ARP Discovery (works only on local subnet)
            devices_by_ip = {}
            device_id = 0
            
            job.update_progress(5)
            
            # For each subnet, perform ARP discovery
            for subnet in subnets:
                if cancel_event.is_set():
                    break
                    
                devices = await self._arp_scan(subnet)
                
                # Save partial result for potential recovery
                job.save_partial_result(f"arp_scan_{subnet}", devices)
                
                # Process discovered devices
                for device in devices:
                    ip = device.get('ip')
                    if ip:
                        device_id += 1
                        devices_by_ip[ip] = {
                            'id': f"device-{device_id}",
                            'ip': ip,
                            'mac': device.get('mac'),
                            'status': 'online',
                            'hostname': None,  # Will be populated later
                            'type': 'other',   # Will be determined later
                            'metadata': {}
                        }
            
            # Check if we have any devices
            if not devices_by_ip and not cancel_event.is_set():
                # Try ping scan as fallback
                job.update_progress(10)
                for subnet in subnets:
                    if cancel_event.is_set():
                        break
                    
                    ping_results = await self._ping_sweep(subnet)
                    
                    # Save partial result for potential recovery
                    job.save_partial_result(f"ping_scan_{subnet}", ping_results)
                    
                    for ip in ping_results:
                        if ip not in devices_by_ip:
                            device_id += 1
                            devices_by_ip[ip] = {
                                'id': f"device-{device_id}",
                                'ip': ip,
                                'mac': None,  # Not available via ping
                                'status': 'online',
                                'hostname': None,
                                'type': 'other',
                                'metadata': {}
                            }
            
            # Phase 2: Hostname Resolution and Port Scanning
            job.update_progress(20)
            
            # Check if cancelled
            if cancel_event.is_set():
                return result
                
            # Resolve hostnames
            for ip, device in list(devices_by_ip.items()):
                if cancel_event.is_set():
                    break
                    
                hostname = await self._get_hostname(ip)
                if hostname:
                    device['hostname'] = hostname
            
            # Save partial results before port scanning
            job.save_partial_result("devices_before_port_scan", devices_by_ip)
            
            # Phase 3: Detailed Port Scanning with Nmap (if requested)
            if job.options.include_ports:
                job.update_progress(30)
                
                # Determine scan intensity based on scan type
                ports = None
                if job.options.scan_type == ScanType.BASIC:
                    os_detection = False
                    service_info = False
                    arguments = "-T4 --top-ports 20"
                elif job.options.scan_type == ScanType.INTENSE:
                    os_detection = True
                    service_info = True
                    arguments = "-T4 --top-ports 100 -sV -O"
                else:  # FULL
                    os_detection = True
                    service_info = True
                    arguments = "-p- -T4 -A"
                
                # Override with explicit options if provided
                if job.options.include_os_detection:
                    os_detection = True
                    arguments += " -O"
                if job.options.include_service_detection:
                    service_info = True
                    arguments += " -sV"
                
                # Prepare target list for nmap
                target_ips = list(devices_by_ip.keys())
                
                # Run nmap scan in batches to avoid overwhelming the system
                batch_size = 10
                total_batches = (len(target_ips) + batch_size - 1) // batch_size
                
                for batch_idx in range(total_batches):
                    if cancel_event.is_set():
                        break
                        
                    start_idx = batch_idx * batch_size
                    end_idx = min((batch_idx + 1) * batch_size, len(target_ips))
                    batch_ips = target_ips[start_idx:end_idx]
                    
                    nmap_results = await self._nmap_scan(
                        batch_ips, 
                        os_detection=os_detection,
                        service_info=service_info,
                        arguments=arguments
                    )
                    
                    # Save partial nmap results
                    job.save_partial_result(f"nmap_batch_{batch_idx}", nmap_results)
                    
                    # Update devices with nmap results
                    for ip, host_data in nmap_results.items():
                        if ip in devices_by_ip:
                            # Update device info
                            if host_data.get('hostname'):
                                devices_by_ip[ip]['hostname'] = host_data['hostname']
                                
                            if host_data.get('status'):
                                devices_by_ip[ip]['status'] = host_data['status']
                                
                            # Update device type based on OS detection
                            if host_data.get('os', {}).get('type'):
                                devices_by_ip[ip]['type'] = host_data['os']['type']
                                
                            # Add OS info to metadata
                            if host_data.get('os', {}).get('name'):
                                if 'metadata' not in devices_by_ip[ip]:
                                    devices_by_ip[ip]['metadata'] = {}
                                devices_by_ip[ip]['metadata']['os'] = host_data['os']['name']
                                devices_by_ip[ip]['metadata']['os_accuracy'] = host_data['os']['accuracy']
                                
                            # Add port info to metadata
                            if host_data.get('ports'):
                                if 'metadata' not in devices_by_ip[ip]:
                                    devices_by_ip[ip]['metadata'] = {}
                                devices_by_ip[ip]['metadata']['ports'] = host_data['ports']
                    
                    # Update progress
                    progress = 30 + int(60 * ((batch_idx + 1) / total_batches))
                    job.update_progress(progress)
            
            # Phase 4: Connection Discovery
            if not cancel_event.is_set():
                job.update_progress(90)
                
                # Get default gateway
                gateway = await self._get_default_gateway()
                gateway_id = None
                
                connections = []
                connection_id = 0
                
                # Find the gateway in our device list
                if gateway and gateway in devices_by_ip:
                    gateway_device = devices_by_ip[gateway]
                    gateway_id = gateway_device['id']
                    gateway_device['type'] = 'router'
                    if not gateway_device['hostname'] or gateway_device['hostname'] == gateway:
                        gateway_device['hostname'] = 'Main Gateway'
                    
                    # Create connections to the gateway
                    for ip, device in devices_by_ip.items():
                        if ip != gateway:
                            connection_id += 1
                            # Measure connection properties
                            latency = await self._measure_latency(ip, gateway)
                            
                            connections.append({
                                'id': f"conn-{connection_id}",
                                'source': device['id'],
                                'target': gateway_id,
                                'status': 'active',
                                'type': 'wired',  # Default assumption
                                'latency': latency,
                                'metadata': {}
                            })
                
                # Set proper labels for all devices
                for ip, device in devices_by_ip.items():
                    if not device.get('hostname') or not device['hostname']:
                        device['label'] = f"{device['type'].capitalize()}-{device['ip'].split('.')[-1]}"
                    else:
                        device['label'] = device['hostname']
            
            # Save final results
            result.devices = devices_by_ip
            result.connections = connections
            
            # Check if we found any devices
            if not devices_by_ip:
                result.warning = "No devices found. The scan may be running in a restricted environment (WSL, VM)."
                
            job.update_progress(99)  # Final progress before completion
            
            return result
            
        except Exception as e:
            logger.exception("Error in network scan")
            result.error = str(e)
            return result
    
    # Network utility methods
    
    async def _get_local_subnets(self) -> List[str]:
        """
        Get local subnets from network interfaces.
        
        Returns:
            List of subnet CIDR strings
        """
        def _get_subnets_sync():
            subnets = []
            try:
                interfaces = netifaces.interfaces()
                
                for interface in interfaces:
                    # Skip loopback interfaces
                    if interface == 'lo':
                        continue
                    
                    # Get addresses for this interface
                    addresses = netifaces.ifaddresses(interface)
                    
                    # Only interested in IPv4 addresses
                    if netifaces.AF_INET in addresses:
                        for address in addresses[netifaces.AF_INET]:
                            if 'addr' in address and 'netmask' in address:
                                ip = address['addr']
                                netmask = address['netmask']
                                
                                # Skip link-local and loopback addresses
                                if ip.startswith('127.') or ip.startswith('169.'):
                                    continue
                                
                                # Convert to CIDR notation
                                try:
                                    cidr = IPNetwork(f"{ip}/{netmask}").cidr
                                    subnets.append(str(cidr))
                                except Exception as e:
                                    logger.warning(f"Error converting {ip}/{netmask} to CIDR: {e}")
            except Exception as e:
                logger.error(f"Error getting local subnets: {e}")
                
            return subnets
            
        # Run in a thread to avoid blocking
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, _get_subnets_sync)
    
    async def _get_default_gateway(self) -> Optional[str]:
        """
        Get the default gateway address.
        
        Returns:
            Default gateway IP or None if not found
        """
        def _get_gateway_sync():
            try:
                gateways = netifaces.gateways()
                default_gateway = gateways['default'][netifaces.AF_INET][0]
                return default_gateway
            except (KeyError, IndexError) as e:
                logger.error(f"Error getting default gateway: {e}")
                return None
        
        # Run in a thread to avoid blocking
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, _get_gateway_sync)
    
    async def _arp_scan(self, target_ip: str) -> List[Dict[str, str]]:
        """
        Perform ARP scan to discover devices.
        
        Args:
            target_ip: Target subnet in CIDR notation
            
        Returns:
            List of discovered devices with IP and MAC
        """
        if not SCAPY_AVAILABLE:
            logger.warning("Scapy not available, ARP scan disabled")
            return []
            
        def _arp_scan_sync(target: str):
            try:
                # Create ARP request packet
                arp_request = ARP(pdst=target)
                broadcast = Ether(dst="ff:ff:ff:ff:ff:ff")
                packet = broadcast/arp_request
                
                # Configure scapy verbosity
                import logging as scapy_logging
                scapy_logging.getLogger("scapy.runtime").setLevel(scapy_logging.ERROR)
                
                # Send and receive packets
                logger.info(f"Scanning {target} via ARP")
                answered, _ = srp(packet, timeout=SCAN_TIMEOUT, verbose=0)
                
                # Extract information from responses
                devices = []
                for sent, received in answered:
                    devices.append({
                        'ip': received.psrc,
                        'mac': received.hwsrc
                    })
                return devices
            except PermissionError:
                logger.warning(f"Insufficient permissions for ARP scan of {target}")
                return []
            except Exception as e:
                logger.error(f"Error in ARP scan of {target}: {e}")
                return []
        
        # Run in a thread to avoid blocking
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, _arp_scan_sync, target_ip)
        
    async def _ping_sweep(self, target_ip: str) -> List[str]:
        """
        Perform ping sweep to discover devices.
        
        Args:
            target_ip: Target subnet in CIDR notation
            
        Returns:
            List of responding IP addresses
        """
        def _ping_sweep_sync(target: str):
            try:
                # Get IP network
                network = ipaddress.IPv4Network(target, strict=False)
                
                # Skip network and broadcast addresses for standard subnets
                ips = [str(ip) for ip in network.hosts()]
                
                # For small networks, don't skip anything
                if len(ips) <= 2:
                    ips = [str(ip) for ip in network]
                
                # Function to ping a single IP
                def ping_ip(ip):
                    try:
                        if sys.platform == "win32":
                            response = os.system(f"ping -n 1 -w {int(PING_TIMEOUT*1000)} {ip} > nul 2>&1")
                            return ip if response == 0 else None
                        else:
                            response = os.system(f"ping -c 1 -W {int(PING_TIMEOUT)} {ip} > /dev/null 2>&1")
                            return ip if response == 0 else None
                    except:
                        return None
                
                # Use a thread pool for parallel pinging
                alive_ips = []
                with ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
                    for ip in executor.map(ping_ip, ips):
                        if ip:
                            alive_ips.append(ip)
                
                return alive_ips
            except Exception as e:
                logger.error(f"Error in ping sweep of {target_ip}: {e}")
                return []
        
        # Run in a thread to avoid blocking
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, _ping_sweep_sync, target_ip)
    
    async def _get_hostname(self, ip: str) -> Optional[str]:
        """
        Resolve hostname for an IP address.
        
        Args:
            ip: IP address to resolve
            
        Returns:
            Hostname or None if not resolvable
        """
        def _get_hostname_sync(target_ip: str):
            try:
                hostname, _, _ = socket.gethostbyaddr(target_ip)
                return hostname
            except (socket.herror, socket.gaierror):
                return None
        
        # Run in a thread to avoid blocking
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, _get_hostname_sync, ip)
    
    async def _nmap_scan(self, targets: List[str], os_detection: bool = False, 
                          service_info: bool = False, arguments: str = None) -> Dict[str, Any]:
        """
        Perform Nmap scan on target IPs.
        
        Args:
            targets: List of target IPs
            os_detection: Whether to include OS detection
            service_info: Whether to include service version info
            arguments: Additional Nmap arguments
            
        Returns:
            Dictionary of scan results by IP
        """
        def _nmap_scan_sync(targets_list, os_flag, svc_flag, args):
            try:
                # Initialize the scanner
                scanner = nmap.PortScanner()
                
                # Build scan arguments
                if not args:
                    scan_args = '-sS'  # SYN scan by default
                    if os_flag:
                        scan_args += ' -O'
                    if svc_flag:
                        scan_args += ' -sV'
                    scan_args += f" --host-timeout {SCAN_TIMEOUT}s"
                else:
                    scan_args = args
                
                # Convert target list to Nmap format
                if isinstance(targets_list, list):
                    target_str = ' '.join(targets_list)
                else:
                    target_str = targets_list
                
                # Perform the scan
                logger.info(f"Running Nmap scan with args: {scan_args}")
                scanner.scan(hosts=target_str, arguments=scan_args)
                
                # Process results
                results = {}
                for host in scanner.all_hosts():
                    host_data = {
                        'hostname': None,
                        'status': 'offline',
                        'mac': None,
                        'ports': [],
                        'os': {
                            'name': None,
                            'type': 'other',
                            'accuracy': 0,
                        }
                    }
                    
                    # Host status
                    if scanner[host].state() == 'up':
                        host_data['status'] = 'online'
                    
                    # Hostname
                    if 'hostnames' in scanner[host] and scanner[host]['hostnames']:
                        hostnames = scanner[host]['hostnames']
                        if isinstance(hostnames, list) and hostnames:
                            for hostname_entry in hostnames:
                                if hostname_entry.get('name'):
                                    host_data['hostname'] = hostname_entry['name']
                                    break
                    
                    # MAC Address
                    if 'addresses' in scanner[host]:
                        addresses = scanner[host]['addresses']
                        if 'mac' in addresses:
                            host_data['mac'] = addresses['mac']
                    
                    # Open ports and services
                    if 'tcp' in scanner[host]:
                        for port, port_data in scanner[host]['tcp'].items():
                            if port_data['state'] == 'open':
                                port_info = {
                                    'port': port,
                                    'protocol': 'tcp',
                                    'service': port_data['name'],
                                    'state': port_data['state'],
                                }
                                
                                # Add version info if available
                                if 'product' in port_data:
                                    port_info['product'] = port_data['product']
                                if 'version' in port_data:
                                    port_info['version'] = port_data['version']
                                
                                host_data['ports'].append(port_info)
                    
                    # OS Detection
                    if os_flag and 'osmatch' in scanner[host] and scanner[host]['osmatch']:
                        os_matches = scanner[host]['osmatch']
                        if os_matches and len(os_matches) > 0:
                            best_match = os_matches[0]
                            host_data['os']['name'] = best_match['name']
                            host_data['os']['accuracy'] = int(best_match['accuracy'])
                            
                            # Try to determine device type from OS name
                            os_name = best_match['name'].lower()
                            if 'router' in os_name or 'gateway' in os_name:
                                host_data['os']['type'] = 'router'
                            elif 'server' in os_name or 'linux' in os_name or 'unix' in os_name:
                                host_data['os']['type'] = 'server'
                            elif 'windows' in os_name:
                                host_data['os']['type'] = 'workstation'
                            elif 'apple' in os_name or 'mac' in os_name or 'ios' in os_name:
                                host_data['os']['type'] = 'workstation'
                            elif 'android' in os_name:
                                host_data['os']['type'] = 'mobile'
                            
                            # Also check port signatures for device type hints
                            if host_data['os']['type'] == 'other':
                                has_web = False
                                has_ssh = False
                                for port_info in host_data['ports']:
                                    if port_info['port'] == 80 or port_info['port'] == 443:
                                        has_web = True
                                    if port_info['port'] == 22:
                                        has_ssh = True
                                
                                if has_web and has_ssh:
                                    host_data['os']['type'] = 'server'
                    
                    results[host] = host_data
                
                return results
            except Exception as e:
                logger.error(f"Error in Nmap scan: {e}")
                return {}
        
        # Run in a thread to avoid blocking
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            None, _nmap_scan_sync, targets, os_detection, service_info, arguments
        )
    
    async def _measure_latency(self, source: str, target: str) -> Optional[float]:
        """
        Measure latency between two hosts.
        
        Args:
            source: Source IP address
            target: Target IP address
            
        Returns:
            Latency in milliseconds or None if unavailable
        """
        def _measure_latency_sync(target_ip):
            try:
                if sys.platform == "win32":
                    cmd = f"ping -n 3 -w 1000 {target_ip}"
                    output = os.popen(cmd).read()
                    # Extract average time
                    if "Average" in output:
                        avg_line = output.split("Average =")[1].strip()
                        avg_ms = float(avg_line.split("ms")[0].strip())
                        return avg_ms
                    return None
                else:
                    cmd = f"ping -c 3 -W 1 {target_ip}"
                    output = os.popen(cmd).read()
                    # Extract average time
                    if "min/avg/max" in output:
                        avg_part = output.split("min/avg/max")[1].strip()
                        avg_ms = float(avg_part.split("/")[1])
                        return avg_ms
                    return None
            except Exception as e:
                logger.warning(f"Error measuring latency to {target_ip}: {e}")
                return None
        
        # Run in a thread to avoid blocking
        loop = asyncio.get_running_loop()
        # We ignore source IP since we're measuring from this machine
        # In a real setup, we'd need a more sophisticated approach
        return await loop.run_in_executor(None, _measure_latency_sync, target)

# Singleton instance for convenience
scanner = NetworkScanner()

# Main API functions to expose to other modules

async def start_scan(scan_options: Optional[ScanOptions] = None) -> ScanJob:
    """
    Start a new network scan.
    
    Args:
        scan_options: Options for the scan
        
    Returns:
        A ScanJob instance
    """
    return await scanner.start_scan(scan_options)

async def cancel_scan(job_id: str) -> bool:
    """
    Cancel a running scan.
    
    Args:
        job_id: ID of the scan to cancel
        
    Returns:
        True if cancelled successfully
    """
    return await scanner.cancel_scan(job_id)

async def get_scan_status(job_id: str) -> Optional[ScanJob]:
    """
    Get the status of a scan.
    
    Args:
        job_id: ID of the scan
        
    Returns:
        The ScanJob if found
    """
    return await scanner.get_scan_status(job_id)

async def get_active_scans() -> List[ScanJob]:
    """
    Get all active scans.
    
    Returns:
        List of active scan jobs
    """
    return await scanner.get_active_scans()

async def get_completed_scans() -> List[ScanJob]:
    """
    Get all completed scans.
    
    Returns:
        List of completed scan jobs
    """
    return await scanner.get_completed_scans()

async def cleanup_stale_jobs(timeout_seconds: int = 1800) -> int:
    """
    Clean up stale scan jobs.
    
    Args:
        timeout_seconds: Maximum allowed run time
        
    Returns:
        Number of jobs cleaned up
    """
    return await scanner.cleanup_stale_jobs(timeout_seconds)

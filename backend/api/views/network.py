from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from ..models import NetworkDevice, NetworkConnection, NetworkScan
from ..serializers import (
    NetworkDeviceSerializer, NetworkDeviceCreateUpdateSerializer,
    NetworkConnectionSerializer, NetworkScanSerializer, NetworkTopologySerializer
)
from ..services.network_scanner import start_scan, cleanup_stale_jobs, ScanOptions

class NetworkDeviceViewSet(viewsets.ModelViewSet):
    """API endpoint for network devices"""
    queryset = NetworkDevice.objects.all().order_by('-last_seen')
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return NetworkDeviceCreateUpdateSerializer
        return NetworkDeviceSerializer
    
    def perform_create(self, serializer):
        # Mark device as manually added
        serializer.save(
            is_manually_added=True,
            status='online',  # Default to online for manually added devices
            last_seen=timezone.now()
        )
    
    @action(detail=True, methods=['post'])
    def set_status(self, request, pk=None):
        device = self.get_object()
        status = request.data.get('status')
        
        if not status or status not in ['online', 'offline', 'warning', 'error']:
            return Response(
                {'error': 'Valid status required (online, offline, warning, error)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        device.status = status
        device.save()
        
        return Response(self.get_serializer(device).data)
    
    @action(detail=True, methods=['post'])
    def ignore(self, request, pk=None):
        device = self.get_object()
        device.is_ignored = True
        device.save()
        return Response({'status': 'device ignored'})
    
    @action(detail=True, methods=['post'])
    def unignore(self, request, pk=None):
        device = self.get_object()
        device.is_ignored = False
        device.save()
        return Response({'status': 'device unignored'})


class NetworkConnectionViewSet(viewsets.ModelViewSet):
    """API endpoint for network connections"""
    queryset = NetworkConnection.objects.all().order_by('-updated_at')
    serializer_class = NetworkConnectionSerializer
    permission_classes = [IsAuthenticated]
    

class NetworkScanViewSet(viewsets.ModelViewSet):
    """API endpoint for network scans"""
    queryset = NetworkScan.objects.all().order_by('-timestamp')
    serializer_class = NetworkScanSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def clean_stale_scans(self, request):
        """
        Clean up any stale in-progress network scans.
        This is useful after a server restart or when a scan gets stuck.
        """
        import asyncio
        from ..services.network_scanner import cleanup_stale_jobs, get_active_scans
        
        # Run async functions within a synchronous view
        cleaned = asyncio.run(cleanup_stale_jobs())
        active_scans = asyncio.run(get_active_scans())
        active = len(active_scans)
        
        return Response({
            'status': 'success',
            'message': f"Cleaned {cleaned} stale scans. {active} active scans remain.",
            'cleaned_count': cleaned,
            'active_count': active
        })
    
    @action(detail=False, methods=['post'])
    def start_scan(self, request):
        ip_range = request.data.get('ip_range')
        
        # Create a new scan record
        scan = NetworkScan.objects.create(
            status='in-progress',
            ip_range=ip_range
        )
        
        # Start the scan process asynchronously
        import asyncio
        from ..services.network_scanner import ScanOptions, ScanType, start_scan
        
        async def run_scan():
            try:
                # Create scan options with the IP range
                options = ScanOptions(
                    scan_type=ScanType.BASIC,
                    ip_range=ip_range
                )
                
                # Start the scan and store the job_id in the scan record
                scan_job = await start_scan(options, user_id=request.user.id)
                
                # Update the scan record with the job_id
                scan.job_id = scan_job.id
                scan.save()
                
            except Exception as e:
                # Update scan record if there's an error
                scan.status = 'failed'
                scan.error_message = str(e)
                scan.save()
        
        # Run the async function in a thread to not block the Django view
        import threading
        threading.Thread(
            target=lambda: asyncio.run(run_scan()),
            daemon=True
        ).start()
        
        return Response({
            'status': 'success',
            'message': 'Network scan started',
            'scan_id': scan.id
        })
    
    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Get the most recent completed scan"""
        latest_scan = NetworkScan.objects.filter(status='completed').order_by('-timestamp').first()
        
        if not latest_scan:
            return Response({'status': 'error', 'message': 'No completed scans found'}, status=404)
        
        serializer = self.get_serializer(latest_scan)
        return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def network_topology(request):
    """Get the full network topology"""
    # Get devices that are not ignored
    devices = NetworkDevice.objects.filter(is_ignored=False).order_by('-last_seen')
    
    # Get connections between these devices
    device_ids = [device.id for device in devices]
    connections = NetworkConnection.objects.filter(
        source__id__in=device_ids,
        target__id__in=device_ids
    ).select_related('source', 'target')
    
    # Get latest scan
    latest_scan = NetworkScan.objects.filter(status='completed').order_by('-timestamp').first()
    
    # Prepare data for serialization
    topology_data = {
        'devices': devices,
        'connections': connections,
        'lastScan': latest_scan
    }
    
    # Serialize the data
    serializer = NetworkTopologySerializer(topology_data)
    
    return Response(serializer.data)

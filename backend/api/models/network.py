import uuid
from django.db import models
from django.utils import timezone
from .base import BaseModel

class NetworkDevice(BaseModel):
    """Model for network devices discovered during network scans"""
    TYPE_CHOICES = [
        ('server', 'Server'),
        ('workstation', 'Workstation'),
        ('router', 'Router'),
        ('switch', 'Switch'),
        ('firewall', 'Firewall'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('online', 'Online'),
        ('offline', 'Offline'),
        ('warning', 'Warning'),
        ('error', 'Error'),
    ]
    
    label = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='other')
    ip = models.GenericIPAddressField(null=True, blank=True)
    mac = models.CharField(max_length=17, null=True, blank=True)
    hostname = models.CharField(max_length=100, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='offline')
    last_seen = models.DateTimeField(default=timezone.now)
    is_ignored = models.BooleanField(default=False, help_text="Ignore this device in future scans")
    is_manually_added = models.BooleanField(default=False, help_text="Whether this device was manually added")
    
    # JSON fields for additional metadata and tags
    metadata = models.JSONField(default=dict, blank=True, null=True)
    tags = models.JSONField(default=list, blank=True, null=True)
    
    class Meta:
        ordering = ['-last_seen']
        verbose_name = "Network Device"
        verbose_name_plural = "Network Devices"
    
    def __str__(self):
        return f"{self.label} ({self.ip or 'No IP'})"
    
    def to_dict(self):
        """Convert device to dictionary format for the frontend"""
        return {
            'id': str(self.id),
            'label': self.label,
            'type': self.type,
            'ip': self.ip,
            'mac': self.mac,
            'hostname': self.hostname,
            'status': self.status,
            'lastSeen': self.last_seen.isoformat(),
            'tags': self.tags if self.tags else [],
            'metadata': self.metadata if self.metadata else {}
        }


class NetworkConnection(BaseModel):
    """Model for connections between network devices"""
    TYPE_CHOICES = [
        ('wired', 'Wired'),
        ('wireless', 'Wireless'),
        ('vpn', 'VPN'),
        ('other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('warning', 'Warning'),
        ('error', 'Error'),
    ]
    
    source = models.ForeignKey(NetworkDevice, on_delete=models.CASCADE, related_name='outbound_connections')
    target = models.ForeignKey(NetworkDevice, on_delete=models.CASCADE, related_name='inbound_connections')
    label = models.CharField(max_length=100, null=True, blank=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='wired')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='inactive')
    bandwidth = models.FloatField(null=True, blank=True, help_text="Bandwidth in Mbps")
    latency = models.FloatField(null=True, blank=True, help_text="Latency in ms")
    packet_loss = models.FloatField(null=True, blank=True, help_text="Packet loss percentage")
    traffic = models.FloatField(null=True, blank=True, help_text="Current traffic in Mbps")
    
    # JSON field for additional metadata
    metadata = models.JSONField(default=dict, blank=True, null=True)
    
    class Meta:
        ordering = ['-updated_at']
        unique_together = ['source', 'target']
        verbose_name = "Network Connection"
        verbose_name_plural = "Network Connections"
    
    def __str__(self):
        return f"{self.source.label} → {self.target.label}"
    
    def to_dict(self):
        """Convert connection to dictionary format for the frontend"""
        return {
            'id': str(self.id),
            'source': str(self.source.id),
            'target': str(self.target.id),
            'label': self.label,
            'type': self.type,
            'status': self.status,
            'bandwidth': self.bandwidth,
            'latency': self.latency,
            'packetLoss': self.packet_loss,
            'traffic': self.traffic,
            'metadata': self.metadata if self.metadata else {}
        }


class NetworkScan(BaseModel):
    """Model for tracking network scans"""
    STATUS_CHOICES = [
        ('in-progress', 'In Progress'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    timestamp = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in-progress')
    discovered_devices = models.IntegerField(default=0)
    duration = models.FloatField(null=True, blank=True, help_text="Duration in seconds")
    ip_range = models.CharField(max_length=100, null=True, blank=True, help_text="IP range scanned")
    scan_method = models.CharField(max_length=100, default="nmap", help_text="Method used for scanning")
    error_message = models.TextField(null=True, blank=True)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = "Network Scan"
        verbose_name_plural = "Network Scans"
    
    def __str__(self):
        return f"Scan {self.id} ({self.timestamp})"
    
    def to_dict(self):
        """Convert scan to dictionary format for the frontend"""
        import datetime
        
        # Calculate if the scan is potentially stale
        # A scan is considered stale if:
        # 1. It's in 'in-progress' status for more than 30 minutes
        is_stale = False
        if self.status == 'in-progress':
            # Get current time in same timezone as self.timestamp
            now = datetime.datetime.now(self.timestamp.tzinfo)
            time_difference = now - self.timestamp
            # If scan is in progress for more than 30 minutes, mark it as stale
            if time_difference.total_seconds() > 1800:  # 30 minutes
                is_stale = True
        
        result = {
            'id': str(self.id),
            'timestamp': self.timestamp.isoformat(),
            'status': self.status,
            'discoveredDevices': self.discovered_devices,
            'duration': self.duration,
            'isStale': is_stale
        }
        
        # Add error message if present
        if self.error_message:
            result['errorMessage'] = self.error_message
            
        return result

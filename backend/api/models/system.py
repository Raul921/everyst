from django.db import models
from django.utils import timezone
from .base import BaseModel


class SystemMetrics(BaseModel):
    """Model for storing system metrics data like CPU, memory, disk usage"""
    timestamp = models.DateTimeField(auto_now_add=True)
    cpu_usage = models.FloatField(help_text="CPU usage percentage")
    memory_usage = models.FloatField(help_text="Memory usage percentage")
    disk_usage = models.FloatField(help_text="Disk usage percentage")
    network_rx = models.FloatField(help_text="Network received (bytes/s)")
    network_tx = models.FloatField(help_text="Network transmitted (bytes/s)")
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name_plural = "System Metrics"
    
    def __str__(self):
        return f"System Metrics at {self.timestamp}"


class Alert(BaseModel):
    """Model for system alerts and notifications"""
    SEVERITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('critical', 'Critical'),
    ]
    
    STATUS_CHOICES = [
        ('new', 'New'),
        ('acknowledged', 'Acknowledged'),
        ('resolved', 'Resolved'),
    ]
    
    timestamp = models.DateTimeField(auto_now_add=True)
    title = models.CharField(max_length=200)
    message = models.TextField()
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    source = models.CharField(max_length=100)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.severity.upper()}: {self.title}"


class SecurityStatus(BaseModel):
    """Model for security-related information"""
    timestamp = models.DateTimeField(auto_now_add=True)
    security_score = models.IntegerField(help_text="Overall security score (0-100)")
    vulnerabilities_count = models.IntegerField(default=0)
    last_scan_date = models.DateTimeField()
    firewall_status = models.BooleanField(default=True)
    updates_available = models.IntegerField(default=0)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name_plural = "Security Statuses"
    
    def __str__(self):
        return f"Security Status at {self.timestamp} - Score: {self.security_score}"

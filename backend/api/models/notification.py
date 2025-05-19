from django.db import models
from .user import User
from .base import BaseModel

class Notification(BaseModel):
    """Model for storing user notifications"""
    TYPE_CHOICES = [
        ('info', 'Information'),
        ('success', 'Success'),
        ('warning', 'Warning'),
        ('error', 'Error'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, 
                           related_name='notifications',
                           help_text="User this notification is for. If null, it's a system-wide notification")
    title = models.CharField(max_length=200)
    message = models.TextField(null=True, blank=True)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='info')
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)
    is_system = models.BooleanField(default=False, help_text="Whether this is a system generated notification")
    source = models.CharField(max_length=100, default='system', help_text="Source of the notification")
    
    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', '-timestamp']),
            models.Index(fields=['is_system', '-timestamp']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.get_type_display()})"
    
    def to_dict(self):
        """Convert notification to dictionary format for the frontend"""
        return {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'timestamp': int(self.timestamp.timestamp() * 1000),  # Convert to JS timestamp
            'read': self.is_read,
            'is_system': self.is_system,
            'source': self.source,
        }

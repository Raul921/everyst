"""
User activity tracking models for security monitoring.
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()

class UserActivity(models.Model):
    """
    Track user activity for security monitoring and auditing
    """
    ACTION_TYPES = (
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('password_change', 'Password Change'),
        ('password_reset', 'Password Reset'),
        ('profile_update', 'Profile Update'),
        ('role_change', 'Role Change'),
        ('api_access', 'API Access'),
        ('admin_action', 'Admin Action'),
        ('security_event', 'Security Event'),
    )
    
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='activities',
        null=True,  # Allow null for activities like failed logins
        blank=True
    )
    action = models.CharField(max_length=50, choices=ACTION_TYPES)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)
    details = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'User Activity'
        verbose_name_plural = 'User Activities'
        indexes = [
            models.Index(fields=['user', 'action']),
            models.Index(fields=['timestamp']),
            models.Index(fields=['ip_address']),
        ]
    
    @classmethod
    def log_activity(cls, user=None, action=None, ip_address=None, user_agent=None, details=None):
        """
        Log a user activity
        
        Args:
            user: The user who performed the action (can be None for anonymous actions)
            action: The type of action performed (one of ACTION_TYPES)
            ip_address: The IP address from which the action was performed
            user_agent: The browser/client used
            details: Additional details about the action (as a dictionary)
        
        Returns:
            The created UserActivity instance
        """
        details = details or {}
        
        # Create activity record
        activity = cls.objects.create(
            user=user,
            action=action,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details
        )
        
        return activity

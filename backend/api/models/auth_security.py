"""
Authentication security models for the everyst API.
"""
from django.db import models
from django.conf import settings
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()

class LoginAttempt(models.Model):
    """
    Track login attempts to prevent brute force attacks
    """
    username = models.CharField(max_length=255)  # Store the username that was attempted
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True, null=True)  # Store browser/client info
    timestamp = models.DateTimeField(auto_now_add=True)
    was_successful = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-timestamp']
    
    @classmethod
    def is_account_locked(cls, username, ip_address=None):
        """
        Check if an account should be locked due to too many failed attempts
        
        Args:
            username: The username to check
            ip_address: The IP address making the request
            
        Returns:
            (bool, datetime): A tuple containing whether the account is locked and when it will be unlocked
        """
        # Get settings from Django settings or use defaults
        max_attempts = getattr(settings, 'MAX_LOGIN_ATTEMPTS', 5)
        lockout_duration = getattr(settings, 'ACCOUNT_LOCKOUT_DURATION', 15)  # minutes
        
        # Define the window for recent attempts
        lockout_threshold = timezone.now() - timezone.timedelta(minutes=lockout_duration)
        
        # Get recent failed attempts
        recent_failed_attempts = cls.objects.filter(
            username=username,
            was_successful=False,
            timestamp__gt=lockout_threshold
        )
        
        # Check IP address if provided
        if ip_address:
            recent_failed_attempts = recent_failed_attempts.filter(ip_address=ip_address)
        
        # If too many failed attempts, lock the account
        if recent_failed_attempts.count() >= max_attempts:
            # Calculate when the account will be unlocked
            oldest_recent_attempt = recent_failed_attempts.order_by('timestamp').first()
            unlock_time = oldest_recent_attempt.timestamp + timezone.timedelta(minutes=lockout_duration)
            
            # If still in the lockout period, return True
            if unlock_time > timezone.now():
                return True, unlock_time
        
        return False, None
    
    @classmethod
    def record_attempt(cls, username, ip_address=None, user_agent=None, was_successful=False):
        """
        Record a login attempt
        
        Args:
            username: The username attempted
            ip_address: The IP address making the request
            user_agent: The user agent of the client
            was_successful: Whether the login was successful
        """
        cls.objects.create(
            username=username,
            ip_address=ip_address,
            user_agent=user_agent,
            was_successful=was_successful
        )
        
        # Clean up old records to prevent database bloat
        # Keep the last 1000 records
        old_records = cls.objects.order_by('-timestamp')[1000:]
        if old_records.exists():
            cls.objects.filter(pk__in=old_records.values_list('pk', flat=True)).delete()

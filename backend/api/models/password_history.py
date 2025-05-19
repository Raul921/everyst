"""
Password history models for the everyst API.
"""
from django.db import models
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()

class PasswordHistory(models.Model):
    """Store password history for users to prevent password reuse"""
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='password_history'
    )
    password = models.CharField(max_length=255)  # Store the hashed password
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Password History'
        verbose_name_plural = 'Password Histories'
    
    @classmethod
    def is_password_used(cls, user, password, count=5):
        """
        Check if the password has been used recently
        
        Args:
            user: The user to check
            password: The raw password to check
            count: The number of recent passwords to check
            
        Returns:
            True if the password has been used, False otherwise
        """
        # Get the most recent passwords
        recent_passwords = cls.objects.filter(user=user).order_by('-created_at')[:count]
        
        # Check if the password matches any of the recent passwords
        for history in recent_passwords:
            if user.check_password_hash(password, history.password):
                return True
                
        return False
    
    @classmethod
    def add_password_to_history(cls, user, password_hash):
        """
        Add a password to the user's history
        
        Args:
            user: The user to add the password for
            password_hash: The hashed password to store
        """
        cls.objects.create(
            user=user,
            password=password_hash
        )
        
        # Clean up old history entries if needed
        max_history = getattr(settings, 'PASSWORD_HISTORY_LENGTH', 10)
        if max_history > 0:
            old_entries = cls.objects.filter(user=user).order_by('-created_at')[max_history:]
            if old_entries.exists():
                cls.objects.filter(id__in=old_entries.values_list('id', flat=True)).delete()

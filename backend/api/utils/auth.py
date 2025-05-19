"""
Authentication-related utilities for password management and security.
"""
from django.utils import timezone
from django.conf import settings
from django.contrib.auth import get_user_model
from datetime import timedelta

User = get_user_model()

def is_password_expired(user):
    """
    Check if a user's password has expired
    
    Args:
        user: The user to check
        
    Returns:
        bool: True if the password is expired, False otherwise
    """
    # Get password expiry days from settings, default to 90 days
    password_expiry_days = getattr(settings, 'PASSWORD_EXPIRY_DAYS', 90)
    
    # If expiry is set to 0, passwords never expire
    if password_expiry_days <= 0:
        return False
    
    # Check if we're tracking the password last changed date
    if not hasattr(user, 'password_last_changed'):
        # If we don't have a password_last_changed field, use the last_login date as fallback
        if not user.last_login:
            # If no last login, use date_joined
            last_change = user.date_joined
        else:
            last_change = user.last_login
    else:
        last_change = user.password_last_changed
    
    # Calculate the expiry date
    expiry_date = last_change + timedelta(days=password_expiry_days)
    
    # Return True if the current date is past the expiry date
    return timezone.now() > expiry_date

def should_change_password(user):
    """
    Determine if a user should be prompted to change their password
    
    Args:
        user: The user to check
        
    Returns:
        (bool, str): A tuple containing whether the password should be changed and the reason
    """
    # Check if the password has expired
    if is_password_expired(user):
        return True, "Your password has expired and must be changed."
    
    # Check if the user is using a temporary password
    # This would require a field on the user model to track this
    if hasattr(user, 'is_temporary_password') and user.is_temporary_password:
        return True, "You are using a temporary password and must change it."
    
    # Add any other conditions here
    
    return False, None

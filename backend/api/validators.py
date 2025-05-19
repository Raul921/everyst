"""
Custom validators for the everyst API.
"""
import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext as _


class PasswordComplexityValidator:
    """
    Validate that the password meets minimum complexity requirements.
    - Contains at least one uppercase letter
    - Contains at least one lowercase letter
    - Contains at least one digit
    - Contains at least one special character
    """
    def __init__(self, min_length=8):
        self.min_length = min_length

    def validate(self, password, user=None):
        if len(password) < self.min_length:
            raise ValidationError(
                _("This password must contain at least %(min_length)d characters."),
                code='password_too_short',
                params={'min_length': self.min_length},
            )
        
        if not re.search(r'[A-Z]', password):
            raise ValidationError(
                _("This password must contain at least one uppercase letter."),
                code='password_no_upper',
            )
        
        if not re.search(r'[a-z]', password):
            raise ValidationError(
                _("This password must contain at least one lowercase letter."),
                code='password_no_lower',
            )
        
        if not re.search(r'[0-9]', password):
            raise ValidationError(
                _("This password must contain at least one digit."),
                code='password_no_digit',
            )
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            raise ValidationError(
                _("This password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)."),
                code='password_no_special',
            )

    def get_help_text(self):
        return _(
            "Your password must contain at least %(min_length)d characters, "
            "including uppercase, lowercase, digits, and special characters."
        ) % {'min_length': self.min_length}


class PasswordHistoryValidator:
    """
    Validate that the password has not been used in the recent password history.
    This skeleton would need to be supported by a PasswordHistory model to be fully functional.
    """
    def __init__(self, history_count=5):
        self.history_count = history_count

    def validate(self, password, user=None):
        if user is None:
            return
        
        # This is a placeholder - in a real implementation you would:
        # 1. Check if the hashed password exists in the user's password history
        # 2. If it does, raise a ValidationError
        
        # Example implementation (requires a PasswordHistory model):
        """
        from api.models.password_history import PasswordHistory
        
        # Check if password matches any of the recent passwords
        if PasswordHistory.is_password_used(user, password, self.history_count):
            raise ValidationError(
                _("This password has been used recently. Please choose a different password."),
                code='password_reuse',
            )
        """
        pass

    def get_help_text(self):
        return _(
            "Your password cannot be the same as any of your last %(history_count)d passwords."
        ) % {'history_count': self.history_count}

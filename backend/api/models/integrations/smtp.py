"""
SMTP integration model for email notifications.
"""
from django.db import models
from ..base import BaseModel


class SMTPConfiguration(BaseModel):
    """
    Stores SMTP configuration for sending emails.
    Only one configuration should be active at a time.
    """
    host = models.CharField(max_length=255, help_text="SMTP server hostname")
    port = models.IntegerField(default=587, help_text="SMTP server port")
    username = models.CharField(max_length=255, blank=True, null=True, help_text="SMTP username/email")
    password = models.CharField(max_length=255, blank=True, null=True, help_text="SMTP password")
    use_tls = models.BooleanField(default=True, help_text="Use TLS encryption")
    from_email = models.EmailField(help_text="Default sender email address")
    from_name = models.CharField(max_length=255, blank=True, null=True, help_text="Default sender name")
    is_active = models.BooleanField(default=True, help_text="Whether this configuration is active")
    last_tested = models.DateTimeField(null=True, blank=True, help_text="Last time this configuration was successfully tested")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        """
        Ensure only one active SMTP configuration exists at a time.
        """
        if self.is_active:
            SMTPConfiguration.objects.exclude(pk=self.pk).update(is_active=False)
        super().save(*args, **kwargs)
    
    class Meta:
        verbose_name = "SMTP Configuration"
        verbose_name_plural = "SMTP Configurations"
    
    def __str__(self):
        return f"SMTP ({self.host}:{self.port}) - {'Active' if self.is_active else 'Inactive'}"

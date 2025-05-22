"""
Integration views package
"""

from .smtp import SMTPConfigurationViewSet

__all__ = ['SMTPConfigurationViewSet']

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.utils import timezone
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr

from api.models.integrations.smtp import SMTPConfiguration
from api.serializers.integrations.smtp import SMTPConfigurationSerializer


class SMTPConfigurationViewSet(viewsets.ModelViewSet):
    """
    API endpoint for SMTP email configuration
    """
    queryset = SMTPConfiguration.objects.all()
    serializer_class = SMTPConfigurationSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        """Return only active configurations by default"""
        return SMTPConfiguration.objects.filter(is_active=True)
    
    @action(detail=True, methods=['post'])
    def test_connection(self, request, pk=None):
        """Test the SMTP connection and send a test email"""
        config = self.get_object()
        recipient = request.data.get('test_email')
        
        if not recipient:
            return Response(
                {'error': 'Test email address is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            # Create test email
            message = MIMEMultipart()
            message['Subject'] = 'Everyst SMTP Test'
            
            # Format the sender with name if provided
            if config.from_name:
                message['From'] = formataddr((config.from_name, config.from_email))
            else:
                message['From'] = config.from_email
                
            message['To'] = recipient
            
            # Email content
            text = "This is a test email from your Everyst SMTP configuration."
            message.attach(MIMEText(text, 'plain'))
            
            # Connect to the SMTP server
            with smtplib.SMTP(config.host, config.port) as server:
                if config.use_tls:
                    server.starttls()
                server.login(config.username, config.password)
                server.send_message(message)
            
            # Update last tested timestamp
            config.last_tested = timezone.now()
            config.save()
            
            return Response({'success': True, 'message': f'Test email sent to {recipient}'})
            
        except Exception as e:
            return Response(
                {'success': False, 'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def perform_create(self, serializer):
        """When creating a new configuration, deactivate all others"""
        # First save the new configuration
        instance = serializer.save()
        
        # Then, if this one is active, deactivate others
        if instance.is_active:
            SMTPConfiguration.objects.exclude(id=instance.id).update(is_active=False)
            
    def perform_update(self, serializer):
        """When updating a configuration, handle activation logic"""
        instance = serializer.save()
        
        # If this one is being activated, deactivate others
        if instance.is_active:
            SMTPConfiguration.objects.exclude(id=instance.id).update(is_active=False)

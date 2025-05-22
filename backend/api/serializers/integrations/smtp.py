"""
Serializer for SMTP integration
"""
from rest_framework import serializers
from api.models.integrations.smtp import SMTPConfiguration


class SMTPConfigurationSerializer(serializers.ModelSerializer):
    """Serializer for SMTP Configuration"""
    
    class Meta:
        model = SMTPConfiguration
        fields = ('id', 'host', 'port', 'username', 'password', 'use_tls',
                  'from_email', 'from_name', 'is_active', 'last_tested',
                  'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at', 'last_tested')
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, data):
        """
        Ensure only one active SMTP configuration exists at a time.
        """
        is_active = data.get('is_active', None)
        if is_active:
            # If activating, ensure no other active config exists
            existing = SMTPConfiguration.objects.filter(is_active=True)
            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)
            if existing.exists():
                raise serializers.ValidationError(
                    'Only one SMTP configuration can be active at a time.'
                )
        return data

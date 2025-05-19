"""
Notification serializers for the everyst API.
"""
from rest_framework import serializers
from api.models.notification import Notification


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for the Notification model"""
    class Meta:
        model = Notification
        fields = ('id', 'user', 'title', 'message', 'type', 'timestamp', 'is_read', 'is_system', 'source')
        read_only_fields = ('id', 'timestamp')

    def to_representation(self, instance):
        """Convert to a frontend-friendly format"""
        representation = super().to_representation(instance)
        # Convert timestamp to Unix timestamp in milliseconds for frontend consumption
        representation['timestamp'] = int(instance.timestamp.timestamp() * 1000)
        # Rename is_read to read for frontend compatibility
        representation['read'] = representation.pop('is_read')
        return representation

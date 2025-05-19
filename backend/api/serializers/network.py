"""
Network-related serializers for the everyst API.
"""
from rest_framework import serializers
from api.models.network import NetworkDevice, NetworkConnection, NetworkScan


class NetworkDeviceSerializer(serializers.ModelSerializer):
    """Serializer for the NetworkDevice model"""
    class Meta:
        model = NetworkDevice
        fields = '__all__'


class NetworkDeviceCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating network devices with proper tag handling"""
    tags = serializers.ListField(child=serializers.CharField(), required=False)
    
    class Meta:
        model = NetworkDevice
        fields = ['id', 'label', 'type', 'ip', 'mac', 'hostname', 'status', 'is_ignored', 'is_manually_added', 'tags']
    
    def create(self, validated_data):
        # Extract tags from validated_data
        tags = validated_data.pop('tags', [])
        # Create the device
        device = NetworkDevice.objects.create(**validated_data)
        # Add tags
        device.tags = tags
        device.save()
        return device
    
    def update(self, instance, validated_data):
        # Extract tags
        if 'tags' in validated_data:
            instance.tags = validated_data.pop('tags')
        
        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance


class NetworkConnectionSerializer(serializers.ModelSerializer):
    """Serializer for the NetworkConnection model"""
    class Meta:
        model = NetworkConnection
        fields = '__all__'


class NetworkScanSerializer(serializers.ModelSerializer):
    """Serializer for the NetworkScan model"""
    class Meta:
        model = NetworkScan
        fields = '__all__'


class NetworkTopologySerializer(serializers.Serializer):
    """Serializer for the complete network topology (devices + connections + scan)"""
    devices = NetworkDeviceSerializer(many=True)
    connections = NetworkConnectionSerializer(many=True)
    lastScan = NetworkScanSerializer(required=False)

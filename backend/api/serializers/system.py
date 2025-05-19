"""
System-related serializers for the everyst API.
"""
from rest_framework import serializers
from api.models.system import SystemMetrics, Alert, SecurityStatus


class SystemMetricsSerializer(serializers.ModelSerializer):
    """Serializer for the SystemMetrics model"""
    class Meta:
        model = SystemMetrics
        fields = '__all__'


class AlertSerializer(serializers.ModelSerializer):
    """Serializer for the Alert model"""
    class Meta:
        model = Alert
        fields = '__all__'


class SecurityStatusSerializer(serializers.ModelSerializer):
    """Serializer for the SecurityStatus model"""
    class Meta:
        model = SecurityStatus
        fields = '__all__'

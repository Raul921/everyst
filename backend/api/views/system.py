"""
System-related views for the everyst API.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from api.models.system import SystemMetrics, Alert, SecurityStatus
from api.serializers.system import SystemMetricsSerializer, AlertSerializer, SecurityStatusSerializer
from api.utils import get_system_metrics


class SystemMetricsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for system metrics
    """
    queryset = SystemMetrics.objects.all().order_by('-timestamp')
    serializer_class = SystemMetricsSerializer
    permission_classes = [IsAuthenticated]


class AlertViewSet(viewsets.ModelViewSet):
    """
    API endpoint for system alerts
    """
    queryset = Alert.objects.all().order_by('-timestamp')
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]


class SecurityStatusViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for security status
    """
    queryset = SecurityStatus.objects.all().order_by('-timestamp')
    serializer_class = SecurityStatusSerializer
    permission_classes = [IsAuthenticated]


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_metrics(request):
    """
    Get the current system metrics
    """
    metrics = get_system_metrics()
    return Response(metrics)

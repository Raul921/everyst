"""
Notification views for the everyst API.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.utils import timezone

from api.models.notification import Notification
from api.serializers.notification import NotificationSerializer


class NotificationViewSet(viewsets.ModelViewSet):
    """
    API endpoint for notifications
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Return notifications for the current user and system notifications
        """
        user = self.request.user
        return Notification.objects.filter(
            Q(user=user) | Q(is_system=True)
        ).order_by('-timestamp')
    
    def perform_create(self, serializer):
        """When creating a notification, associate it with the current user"""
        serializer.save(user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def mark_as_read(self, request):
        """Mark specific notifications as read"""
        try:
            notification_ids = request.data.get('ids', [])
            user = request.user
            
            # Update notifications that belong to this user or are system notifications
            updated = Notification.objects.filter(
                Q(id__in=notification_ids),
                Q(user=user) | Q(is_system=True)
            ).update(is_read=True)
            
            return Response({'updated': updated}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Mark all notifications as read for the current user"""
        try:
            user = request.user
            
            # Update notifications that belong to this user or are system notifications
            updated = Notification.objects.filter(
                Q(user=user) | Q(is_system=True),
                is_read=False
            ).update(is_read=True)
            
            return Response({'updated': updated}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications for the current user"""
        try:
            user = request.user
            
            # Count notifications that belong to this user or are system notifications
            unread_count = Notification.objects.filter(
                Q(user=user) | Q(is_system=True),
                is_read=False
            ).count()
            
            return Response({'count': unread_count}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent notifications (last 7 days)"""
        try:
            user = request.user
            seven_days_ago = timezone.now() - timezone.timedelta(days=7)
            
            # Get recent notifications
            notifications = Notification.objects.filter(
                Q(user=user) | Q(is_system=True),
                timestamp__gte=seven_days_ago
            ).order_by('-timestamp')[:10]
            
            serializer = self.get_serializer(notifications, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

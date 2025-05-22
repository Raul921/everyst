\
\"\"\"
Activity log views for the everyst API.
\"\"\"
from rest_framework import viewsets, permissions
from api.models.activity import ApplicationLog
from api.serializers.activity import ApplicationLogSerializer
from api.permissions import CanViewAllData # Or a more specific permission

class ApplicationLogViewSet(viewsets.ReadOnlyModelViewSet):
    \"\"\"
    API endpoint for accessing application logs.
    \"\"\"
    queryset = ApplicationLog.objects.all().order_by('-timestamp')
    serializer_class = ApplicationLogSerializer
    permission_classes = [permissions.IsAuthenticated, CanViewAllData] # Ensure only authorized users can access

    # You can add custom filters here if needed, e.g., by user, action, date range
    # def get_queryset(self):
    #     queryset = super().get_queryset()
    #     # Example: Filter by user if a username is provided in query params
    #     username = self.request.query_params.get('username')
    #     if username:
    #         queryset = queryset.filter(user__username=username)
    #     return queryset

"""
Authentication views for the everyst API.
"""
from django.utils import timezone
from django.contrib.auth import get_user_model

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from api.serializers.user import UserSerializer

User = get_user_model()

def csrf_failure(request, reason=""):
    """
    Custom view for CSRF validation failures.
    This view will be called when CSRF validation fails.
    Returns a JSON response instead of Django's default HTML response.
    """
    from django.http import JsonResponse
    return JsonResponse({
        'detail': 'CSRF verification failed. Request aborted.',
        'reason': reason
    }, status=403)

class HealthCheckView(APIView):
    """
    Simple health check endpoint to verify the API is running
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({
            'status': 'ok',
            'timestamp': timezone.now().isoformat(),
            'service': 'everyst API'
        })


class RegisterView(APIView):
    """
    API view for user registration
    """
    permission_classes = [AllowAny]

    def post(self, request):
        # First, check if any users already exist
        if User.objects.exists():
            return Response(
                {"detail": "Registration is disabled. User accounts already exist."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            # This is guaranteed to be the first user
            is_first_user = True
            
            # Save the user from serializer
            user = serializer.save()
            
            # If this is the first user, make them owner and superuser
            if is_first_user:
                # Ensure UserRole defaults exist
                from api.models.role import UserRole
                UserRole.create_default_roles()
                
                # Set as owner
                owner_role = UserRole.objects.get(name=UserRole.OWNER)
                user.role = owner_role
                user.is_staff = True
                user.is_superuser = True
                user.save()
                
            refresh = RefreshToken.for_user(user)
            
            # Get a fresh serialized user to include the updated role info
            updated_serializer = UserSerializer(user)
            
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': updated_serializer.data,
                'is_owner': is_first_user
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

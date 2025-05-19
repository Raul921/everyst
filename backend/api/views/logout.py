"""
This module adds CSRF failure view and token blacklist functionality.
"""
from django.shortcuts import render
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken, OutstandingToken
import logging

logger = logging.getLogger('middleware.auth')

def csrf_failure(request, reason=""):
    """
    Custom CSRF failure view to provide a friendly error message
    """
    return render(request, '403_csrf.html', {'reason': reason}, status=403)


class LogoutView(APIView):
    """
    API endpoint for logging out users.
    Blacklists the refresh token to prevent reuse.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Process a logout request by blacklisting the user's token"""
        try:
            # Get the refresh token from the request
            refresh_token = request.data.get('refresh')
            
            if not refresh_token:
                return Response(
                    {"detail": "Refresh token is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create RefreshToken instance and blacklist it
            token = RefreshToken(refresh_token)
            token.blacklist()
            
            # Log the logout event
            logger.info(f"User {request.user.username} logged out successfully")
            
            return Response(
                {"detail": "Logout successful, token has been blacklisted"}, 
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Logout failed for user {request.user.username}: {str(e)}")
            return Response(
                {"detail": "Invalid token or token already blacklisted"},
                status=status.HTTP_400_BAD_REQUEST
            )


class LogoutAllView(APIView):
    """
    API endpoint for logging out from all devices.
    Blacklists all refresh tokens for the current user.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Blacklist all refresh tokens for the user"""
        try:
            # Get all outstanding tokens for this user
            tokens = OutstandingToken.objects.filter(user_id=request.user.id)
            
            # Blacklist all tokens
            for token in tokens:
                # Skip already blacklisted tokens
                if not BlacklistedToken.objects.filter(token=token).exists():
                    BlacklistedToken.objects.create(token=token, blacklisted_at=timezone.now())
            
            # Log the logout event
            logger.info(f"User {request.user.username} logged out from all devices")
            
            return Response(
                {"detail": "Successfully logged out from all devices"},
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            logger.error(f"Logout from all devices failed for user {request.user.username}: {str(e)}")
            return Response(
                {"detail": "An error occurred while logging out from all devices"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

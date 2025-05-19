"""
Authentication middleware for the everyst API.

This middleware provides JWT token authentication for ASGI applications.
"""

from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
import jwt
import logging
from typing import Dict, Any, Callable, Awaitable

logger = logging.getLogger('middleware.auth')

User = get_user_model()

class TokenAuthMiddleware:
    """
    Middleware for JWT token authentication in ASGI applications.
    
    This middleware extracts the JWT token from the request headers or query parameters,
    validates it, and attaches the authenticated user to the scope.
    """
    
    def __init__(self, inner):
        """
        Initialize the middleware with the inner application.
        
        Args:
            inner: The inner application to wrap
        """
        self.inner = inner
    
    async def __call__(self, scope, receive, send):
        """
        Process an ASGI request and authenticate the user based on JWT token.
        
        Args:
            scope: The ASGI scope
            receive: The ASGI receive function
            send: The ASGI send function
        """
        # Default to anonymous user
        scope['user'] = AnonymousUser()
        
        # Extract token from headers or query parameters
        token = self._get_token_from_scope(scope)
        if token:
            try:
                # Authenticate user based on token
                user = await self._authenticate_credentials(token)
                if user:
                    scope['user'] = user
                    logger.debug(f"User authenticated: {user.username}")
            except Exception as e:
                logger.warning(f"Token authentication failed: {str(e)}")
        
        # Process the request with the authenticated user
        return await self.inner(scope, receive, send)
    
    def _get_token_from_scope(self, scope: Dict[str, Any]) -> str:
        """
        Extract the JWT token from the ASGI scope.
        
        Args:
            scope: The ASGI scope
            
        Returns:
            str: The extracted JWT token or an empty string if not found
        """
        # Try to get token from headers
        headers = dict(scope.get('headers', []))
        auth_header = headers.get(b'authorization', b'').decode('latin1')
        
        if auth_header.startswith('Bearer '):
            return auth_header.split(' ')[1]
        
        # Try to get token from query parameters
        query_string = scope.get('query_string', b'').decode('latin1')
        query_params = dict(param.split('=') for param in query_string.split('&') if '=' in param)
        return query_params.get('token', '')
    
    @database_sync_to_async
    def _authenticate_credentials(self, token: str):
        """
        Authenticate the user based on the JWT token.
        
        Args:
            token: The JWT token string
            
        Returns:
            User: The authenticated user or None if authentication fails
            
        Raises:
            InvalidToken: If the token is invalid
        """
        try:
            # Validate the token
            validated_token = AccessToken(token)
            user_id = validated_token['user_id']
            
            # Get the user from the database
            user = User.objects.get(id=user_id)
            
            # Check if the user is active
            if not user.is_active:
                logger.warning(f"User {user.username} is inactive")
                return None
            
            return user
            
        except User.DoesNotExist:
            logger.warning(f"User with id {user_id} not found")
            return None
            
        except (InvalidToken, TokenError) as e:
            logger.warning(f"Invalid token: {str(e)}")
            return None

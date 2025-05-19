"""
Security-related middleware for tracking API activity.
"""
import json
import time
import logging
import asyncio
import inspect
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings
from django.urls import resolve, Resolver404
from django.utils import timezone

logger = logging.getLogger('middleware.activity')

class APIActivityMiddleware:
    """
    Middleware to track API activity for security monitoring.
    Logs request patterns, response times, and suspicious activity.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        # Define paths that should be exempt from detailed logging
        self.exempt_paths = [
            '/api/auth/refresh/',
            '/api/health/',
            '/api/system/metrics/current/',
        ]
        # Define sensitive parameter names that should be masked in logs
        self.sensitive_params = [
            'password', 'token', 'key', 'secret', 'authorization',
            'current_password', 'new_password', 'credit_card', 'otp'
        ]
        # Required for Django async compatibility
        self.sync_capable = True
        self.async_capable = True
    
    def __call__(self, request):
        """
        Standard synchronous request/response middleware for Django WSGI.
        """
        # Store the start time for measuring response time
        request.start_time = time.time()
        
        # Process the request
        self._process_request(request)
        
        # Get the response from the view
        response = self.get_response(request)
        
        # Process the response
        return self._process_response(request, response)
    
    async def __acall__(self, request):
        """
        Asynchronous version of the middleware for Django ASGI.
        """
        # Store the start time for measuring response time
        request.start_time = time.time()
        
        # Process the request
        self._process_request(request)
        
        # Get response asynchronously
        response = await self.get_response(request)
        
        # Process the response
        return self._process_response(request, response)
    
    def _process_request(self, request):
        """Process the request before it reaches the view"""
        # Store the start time for measuring response time
        request.start_time = time.time()
        
        # Skip detailed processing for static files and excluded paths
        path = request.path_info.lstrip('/')
        if path.startswith(('static/', 'media/')) or request.path in self.exempt_paths:
            return None
            
        # Try to get the resolved URL pattern for better categorization
        try:
            request.url_name = resolve(request.path).url_name
        except Resolver404:
            request.url_name = None
        
        # Log basic request information
        if settings.DEBUG:
            logger.debug(f"API Request: {request.method} {request.path}")
            
        return None
    
    def _process_response(self, request, response):
        """Process the response after the view is executed"""
        # Skip processing for static files and excluded paths
        path = request.path_info.lstrip('/')
        if path.startswith(('static/', 'media/')) or request.path in self.exempt_paths:
            return response
            
        # Calculate response time
        if hasattr(request, 'start_time'):
            response_time = time.time() - request.start_time
            response['X-Response-Time'] = str(int(response_time * 1000))  # in milliseconds
            
            # Log slow responses (>1 second) for potential optimization
            if response_time > 1:
                logger.warning(f"Slow API Response: {request.method} {request.path} - {response_time:.2f}s")
        
        # Log API requests for monitoring (using Django's user authentication system)
        if hasattr(request, 'user') and request.user.is_authenticated:
            # Get the user's IP
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0].strip()
            else:
                ip = request.META.get('REMOTE_ADDR')
                
            # Log only non-2xx responses or important security-related endpoints
            status_code = response.status_code
            if status_code < 200 or status_code >= 300 or self._is_security_endpoint(request.path):
                # Get and sanitize request body for logging
                body = self._get_sanitized_request_data(request)
                
                try:
                    # Log the activity to the database if the model is available
                    from api.models.activity import UserActivity
                    
                    # Determine action type based on path and method
                    action = self._determine_action_type(request)
                    
                    # Log to database
                    UserActivity.log_activity(
                        user=request.user if request.user.is_authenticated else None,
                        action=action,
                        ip_address=ip,
                        user_agent=request.META.get('HTTP_USER_AGENT', ''),
                        details={
                            'method': request.method,
                            'path': request.path,
                            'status_code': status_code,
                            'response_time': f"{response_time:.2f}s" if hasattr(request, 'start_time') else None,
                            'query_params': dict(request.GET.items()),
                            'body': body,
                        }
                    )
                except (ImportError, Exception) as e:
                    # Fall back to standard logging if database logging fails
                    logger.error(f"Failed to log activity to database: {str(e)}")
                    logger.info(
                        f"API Activity: {request.user.username} - {request.method} {request.path} - "
                        f"Status: {status_code} - Time: {response_time:.2f}s"
                    )
        
        return response
    
    def _is_security_endpoint(self, path):
        """Check if the path is a security-related endpoint that should always be logged"""
        security_paths = [
            '/api/auth/login',
            '/api/auth/logout',
            '/api/users/',
            '/api/roles/',
        ]
        
        for security_path in security_paths:
            if path.startswith(security_path):
                return True
                
        return False
    
    def _determine_action_type(self, request):
        """Determine the type of action based on the request path and method"""
        path = request.path
        method = request.method
        
        # Authentication actions
        if path.startswith('/api/auth/login'):
            return 'login'
        elif path.startswith('/api/auth/logout'):
            return 'logout'
        elif path.startswith('/api/auth/refresh'):
            return 'api_access'
            
        # User management actions
        elif path.startswith('/api/users/') and 'change-password' in path:
            return 'password_change'
        elif path.startswith('/api/users/') and 'set_role' in path:
            return 'role_change'
        elif path.startswith('/api/users/') and method in ['PUT', 'PATCH']:
            return 'profile_update'
            
        # Default for other API access
        return 'api_access'
    
    def _get_sanitized_request_data(self, request):
        """Get request body data with sensitive information masked"""
        try:
            # Get content type and request body
            content_type = request.content_type
            
            if hasattr(request, 'body') and request.body:
                body = request.body.decode('utf-8')
                
                # For JSON data, parse and sanitize
                if 'application/json' in content_type:
                    try:
                        data = json.loads(body)
                        return self._sanitize_data(data)
                    except json.JSONDecodeError:
                        return "[Invalid JSON]"
                
                # For form data, sanitize the request.POST dictionary
                elif 'application/x-www-form-urlencoded' in content_type:
                    return self._sanitize_data(dict(request.POST.items()))
                
                # For other types, return placeholder
                else:
                    return "[Binary data]"
            
            return "{}"
            
        except Exception as e:
            return f"[Error reading request body: {str(e)}]"
    
    def _sanitize_data(self, data):
        """
        Recursively sanitize data by replacing sensitive values with [REDACTED]
        """
        if isinstance(data, dict):
            result = {}
            for key, value in data.items():
                # Check if the key is in the sensitive parameters list
                if any(param in key.lower() for param in self.sensitive_params):
                    result[key] = '[REDACTED]'
                else:
                    result[key] = self._sanitize_data(value)
            return result
        elif isinstance(data, list):
            return [self._sanitize_data(item) for item in data]
        else:
            return data

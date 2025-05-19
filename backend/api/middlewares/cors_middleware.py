"""
CORS middleware for the everyst API.

This middleware handles Cross-Origin Resource Sharing (CORS) headers
for ASGI applications. It allows controlled access to resources from different origins.
"""

import logging
from typing import Dict, Any, List, Callable, Awaitable, Optional, Union

logger = logging.getLogger('middleware.cors')

class CorsMiddleware:
    """
    Middleware for handling CORS headers in ASGI applications.
    
    This middleware adds appropriate CORS headers to responses based on
    the configured allowed origins, methods, and headers.
    """
    
    def __init__(
        self, 
        inner,
        allow_origins: Union[List[str], str] = "*",
        allow_methods: List[str] = None,
        allow_headers: List[str] = None,
        allow_credentials: bool = True,
        expose_headers: List[str] = None,
        max_age: int = 86400  # 24 hours
    ):
        """
        Initialize the middleware with the inner application and CORS settings.
        
        Args:
            inner: The inner application to wrap
            allow_origins: List of allowed origins or "*" for all origins
            allow_methods: List of allowed HTTP methods
            allow_headers: List of allowed request headers
            allow_credentials: Whether to allow credentials
            expose_headers: List of headers to expose to the browser
            max_age: Maximum age of preflight requests in seconds
        """
        self.inner = inner
        self.allow_origins = allow_origins
        self.allow_methods = allow_methods or ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
        self.allow_headers = allow_headers or ["Authorization", "Content-Type", "Accept", "Origin", "User-Agent"]
        self.allow_credentials = allow_credentials
        self.expose_headers = expose_headers or []
        self.max_age = max_age
    
    async def __call__(self, scope, receive, send):
        """
        Process an ASGI request and add CORS headers to the response.
        
        Args:
            scope: The ASGI scope
            receive: The ASGI receive function
            send: The ASGI send function
        """
        # Only handle HTTP requests
        if scope['type'] != 'http':
            return await self.inner(scope, receive, send)
        
        # Check if this is a preflight OPTIONS request
        is_preflight = scope['method'] == 'OPTIONS'
        
        # Get the Origin header
        headers = dict(scope.get('headers', []))
        origin = headers.get(b'origin', b'').decode('latin1')
        
        # Create a wrapper for the send function to add CORS headers
        async def send_wrapper(message):
            if message['type'] == 'http.response.start':
                # Add CORS headers to the response
                headers = message.get('headers', [])
                
                # Add appropriate CORS headers
                cors_headers = self._get_cors_headers(origin, is_preflight)
                for name, value in cors_headers.items():
                    headers.append((name.encode('latin1'), value.encode('latin1')))
                
                message['headers'] = headers
                
                # Log CORS request handling
                if origin:
                    logger.debug(f"CORS request from origin: {origin}")
            
            # Pass the message to the original send function
            return await send(message)
        
        # For preflight requests, send a successful response
        if is_preflight:
            return await self._handle_preflight(send_wrapper)
        
        # For regular requests, process normally with CORS headers
        return await self.inner(scope, receive, send_wrapper)
    
    def _get_cors_headers(self, origin: str, is_preflight: bool) -> Dict[str, str]:
        """
        Generate CORS headers based on the request origin and type.
        
        Args:
            origin: The origin of the request
            is_preflight: Whether this is a preflight OPTIONS request
            
        Returns:
            Dict[str, str]: Dictionary of CORS headers
        """
        headers = {}
        
        # Only add headers if an origin is provided
        if not origin:
            return headers
        
        # Check if the origin is allowed
        if self.allow_origins == "*":
            headers["Access-Control-Allow-Origin"] = "*"
        elif origin in self.allow_origins:
            headers["Access-Control-Allow-Origin"] = origin
            headers["Vary"] = "Origin"
        else:
            # Origin not allowed, don't add CORS headers
            return headers
        
        # If credentials are allowed, can't use wildcard origin
        if self.allow_credentials and headers.get("Access-Control-Allow-Origin") == "*":
            headers["Access-Control-Allow-Origin"] = origin
            headers["Vary"] = "Origin"
        
        # Add credentials header if enabled
        if self.allow_credentials:
            headers["Access-Control-Allow-Credentials"] = "true"
        
        # Add additional headers for preflight requests
        if is_preflight:
            headers["Access-Control-Allow-Methods"] = ", ".join(self.allow_methods)
            headers["Access-Control-Allow-Headers"] = ", ".join(self.allow_headers)
            headers["Access-Control-Max-Age"] = str(self.max_age)
        
        # Add exposed headers
        if self.expose_headers:
            headers["Access-Control-Expose-Headers"] = ", ".join(self.expose_headers)
        
        return headers
    
    async def _handle_preflight(self, send: Callable[[Dict[str, Any]], Awaitable[None]]) -> None:
        """
        Handle a CORS preflight (OPTIONS) request.
        
        Args:
            send: The ASGI send function wrapped with CORS headers
        """
        await send({
            "type": "http.response.start",
            "status": 200,
            "headers": []  # CORS headers will be added by send_wrapper
        })
        
        await send({
            "type": "http.response.body",
            "body": b"",
        })

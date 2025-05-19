"""
Request logging middleware for the everyst API.

This middleware logs detailed information about incoming requests and responses.
"""

import time
import logging
import json
from typing import Dict, Any, Callable, Awaitable

logger = logging.getLogger('middleware.logging')

class RequestLoggingMiddleware:
    """
    Middleware for logging request and response details in ASGI applications.
    
    This middleware logs information about incoming requests and outgoing responses,
    including timing information, status codes, and basic request details.
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
        Process an ASGI request and log information about it.
        
        Args:
            scope: The ASGI scope
            receive: The ASGI receive function
            send: The ASGI send function
        """
        # Only log HTTP requests
        if scope['type'] != 'http':
            return await self.inner(scope, receive, send)
        
        # Start timing the request
        start_time = time.time()
        
        # Extract request details
        path = scope.get('path', '')
        method = scope.get('method', '')
        headers = dict(scope.get('headers', []))
        client = scope.get('client', ('unknown', 0))
        
        # Log the incoming request
        logger.info(f"Request: {method} {path} from {client[0]}:{client[1]}")
        
        # Create a wrapper for the send function to intercept the response
        async def send_wrapper(message):
            if message['type'] == 'http.response.start':
                # Extract the status from the response
                status = message.get('status', 0)
                
                # Calculate the request duration
                duration = time.time() - start_time
                
                # Log the response
                logger.info(f"Response: {status} for {method} {path} in {duration:.3f}s")
                
            # Pass the message to the original send function
            return await send(message)
        
        # Process the request with the response logging
        return await self.inner(scope, receive, send_wrapper)

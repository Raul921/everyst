"""
Core Socket.IO server setup for everyst API.

This module initializes the Socket.IO server and provides the main application factory.
It defines core server configuration but delegates specific event handlers to other modules.
"""

import socketio
import logging
import os
from typing import Dict, Optional, Any, Callable, Awaitable
import asyncio

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('socket_server')

# Get DEBUG_MODE from environment
DEBUG_MODE = os.environ.get('DEBUG_MODE', 'False').lower() in ('true', '1', 'yes')

# Configure socketio and engineio logging levels based on DEBUG_MODE
logging.getLogger('socketio').setLevel(logging.DEBUG if DEBUG_MODE else logging.WARNING)
logging.getLogger('socketio.server').setLevel(logging.DEBUG if DEBUG_MODE else logging.WARNING)
logging.getLogger('engineio').setLevel(logging.DEBUG if DEBUG_MODE else logging.WARNING) 
logging.getLogger('engineio.server').setLevel(logging.DEBUG if DEBUG_MODE else logging.WARNING)
# Also suppress websocket debug messages unless in debug mode
logging.getLogger('websockets').setLevel(logging.DEBUG if DEBUG_MODE else logging.WARNING)

# Create a Socket.IO server instance
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',  # Allow connections from any origin
    logger=DEBUG_MODE,  # Use DEBUG_MODE to control socketio logger
    engineio_logger=DEBUG_MODE,  # Use DEBUG_MODE to control engineio logger
    ping_timeout=60,
    ping_interval=25,
    always_connect=False  # Ensure proper CORS handling
)

# Dictionary to track connected clients and user sessions
# These are shared resources across all socket.io modules
connected_clients: Dict[str, bool] = {}
user_sessions: Dict[str, str] = {}  # user_id -> sid
session_users: Dict[str, str] = {}  # sid -> user_id

# Flag to control the metrics broadcasting thread
should_run: bool = True
    
def create_socket_app(startup_tasks: Optional[Callable[[], Awaitable[None]]] = None) -> socketio.ASGIApp:
    """
    Create and configure the Socket.IO ASGI application.
    
    Args:
        startup_tasks: Optional async function to run at server startup
        
    Returns:
        socketio.ASGIApp: The configured Socket.IO ASGI application
    """
    # Set up the startup event handler
    @sio.event
    async def connect(sid, environ):
        """Handle new client connections and run startup tasks if needed"""
        # Process and handle query parameters
        query = environ.get('QUERY_STRING', '')
        logger.info(f"Client connecting: {sid} with query: {query}")
        
        # Add to connected clients
        connected_clients[sid] = True
        logger.info(f"Client connected: {sid}")
        
        # Run startup tasks on first connection
        # This is a pattern to run tasks that need the async context
        if startup_tasks and not hasattr(connect, 'startup_complete'):
            connect.startup_complete = True
            logger.info("Running server startup tasks...")
            try:
                await startup_tasks()
            except Exception as e:
                logger.error(f"Error in startup tasks: {e}")

    # Create the ASGI application
    app = socketio.ASGIApp(
        sio,
        socketio_path='socket.io',
    )
    
    return app

def start_background_task(target: Callable[[], None]):
    """
    Helper function to start a background task with the Socket.IO server.
    
    Args:
        target: Callable function to run in the background
        
    Returns:
        The result of sio.start_background_task
    """
    try:
        logger.info(f"Starting background task: {target.__name__}")
        return sio.start_background_task(target)
    except Exception as e:
        logger.error(f"Error starting background task: {e}")
        raise

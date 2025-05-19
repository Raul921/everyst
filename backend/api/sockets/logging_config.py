"""
Socket.IO and EngineIO logging configuration utilities.

This module provides functions to configure logging for Socket.IO and EngineIO
to prevent excessive debug logs regardless of the environment settings.
"""

import logging

def configure_socket_logging():
    """
    Configure all Socket.IO and EngineIO related loggers to WARNING level or higher.
    This forces these loggers to WARNING regardless of the environment settings.
    """
    # Set root logger to INFO level
    logging.getLogger().setLevel(logging.INFO)
    
    # Force socketio and engineio to use WARNING level (higher than INFO/DEBUG)
    logging.getLogger('socketio').setLevel(logging.WARNING)
    logging.getLogger('socketio.client').setLevel(logging.WARNING)
    logging.getLogger('socketio.server').setLevel(logging.WARNING)
    
    logging.getLogger('engineio').setLevel(logging.WARNING)
    logging.getLogger('engineio.client').setLevel(logging.WARNING)
    logging.getLogger('engineio.server').setLevel(logging.WARNING)
    
    # Also suppress websocket debug messages which can be verbose
    logging.getLogger('websockets').setLevel(logging.WARNING)
    logging.getLogger('websockets.protocol').setLevel(logging.WARNING)
    
    # Suppress uvicorn access logs for websocket connections
    logging.getLogger('uvicorn.access').setLevel(logging.WARNING)
    
    # Log that we've successfully configured logging
    logger = logging.getLogger('socket_server')
    logger.info("Socket.IO and EngineIO logging configured to WARNING level")

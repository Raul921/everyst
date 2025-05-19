"""
Socket.IO implementation for everyst API.

This package provides a modular implementation of the Socket.IO server,
with clear separation of concerns between authentication, event handling,
metrics broadcasting, and network-related socket events.
"""

from .server import create_socket_app, sio
from .logging_config import configure_socket_logging

__all__ = ['create_socket_app', 'sio', 'configure_socket_logging']

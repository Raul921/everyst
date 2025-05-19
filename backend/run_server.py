#!/usr/bin/env python
"""
Unified server runner for the Everyst API with clean ASGI integration.

This script provides a robust entry point for running the Everyst backend
with proper handling of:
- SSL/TLS configuration
- CORS headers
- IP address detection
- Environment variable configuration
- Development vs. production settings

Usage:
  python run_server.py [--dev] [--host HOST] [--port PORT] [--no-ssl]
"""
import uvicorn
import os
import sys
import django
import argparse
import pathlib
import logging
import dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("server")

# Load environment variables from .env file
dotenv.load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))
import socket
import logging
from typing import Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('server')

def get_local_ip() -> str:
    """
    Get the local IP address of the server.
    
    Returns:
        str: Local IP address or fallback to "0.0.0.0" if detection fails
    """
    try:
        # Create a socket to connect to an external service
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # Doesn't need to be reachable
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception as e:
        logger.warning(f"Failed to detect local IP: {e}")
        return "0.0.0.0"  # fallback

def parse_args() -> argparse.Namespace:
    """
    Parse command line arguments.
    
    Returns:
        argparse.Namespace: Parsed command line arguments
    """
    parser = argparse.ArgumentParser(description="Run the Everyst API server")
    parser.add_argument('--dev', action='store_true', help='Run in development mode')
    parser.add_argument('--host', type=str, help='Host to bind to (overrides API_HOST env var)')
    parser.add_argument('--port', type=int, help='Port to bind to (overrides API_PORT env var)')
    parser.add_argument('--no-ssl', action='store_true', help='Disable SSL')
    return parser.parse_args()

if __name__ == "__main__":
    # Parse command line arguments
    args = parse_args()
    
    # Always use localhost for consistency, with command line args as override only
    dev_mode = args.dev or os.environ.get("EVERYST_DEV", "").lower() in ("true", "1", "yes")
    
    # Hardcode to use localhost unless explicitly overridden by command line arguments
    host = args.host if args.host else "localhost"
    
    port = args.port if args.port else 8000
    use_ssl = not args.no_ssl
    
    # Set Django settings module
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'everyst_api.settings')
    
    # Get the absolute path to cert files
    base_dir = pathlib.Path(__file__).resolve().parent.parent
    cert_path = base_dir / "certs" / "cert.pem"
    key_path = base_dir / "certs" / "key.pem"
    
    # Get DEBUG_MODE from environment
    debug_mode_env = os.environ.get('DEBUG_MODE', 'False').lower() in ('true', '1', 'yes')
    
    # Build the uvicorn configuration
    config = {
        "app": "everyst_api.asgi:application",
        "host": host,
        "port": port,
        "reload": dev_mode,
        "log_level": "debug" if debug_mode_env else "info",  # Use DEBUG_MODE for log level
        # Add headers for CORS with HTTPS
        "headers": [
            ("Access-Control-Allow-Origin", "*"),
            ("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"),
            ("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, X-Request-With"),
            ("Access-Control-Allow-Credentials", "true"),
        ]
    }
    
    # Add SSL configuration if enabled
    if use_ssl and cert_path.exists() and key_path.exists():
        config.update({
            "ssl_certfile": str(cert_path),
            "ssl_keyfile": str(key_path),
        })
        protocol = "https"
        ws_protocol = "wss"
        logger.info("SSL enabled with certificate files")
    else:
        if use_ssl:
            logger.warning("SSL certificates not found, falling back to HTTP")
        protocol = "http"
        ws_protocol = "ws"
    
    # Print startup information
    logger.info(f"Starting everyst API server in {'development' if dev_mode else 'production'} mode")
    logger.info(f"Access your API at {protocol}://{host}:{port}")
    logger.info(f"Access WebSocket endpoint at {ws_protocol}://{host}:{port}/socket.io/")
    
    # Run the ASGI server
    uvicorn.run(**config)
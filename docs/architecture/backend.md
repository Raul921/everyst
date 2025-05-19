# Backend Architecture

## Overview

Everyst's backend is built on Django with Socket.IO integration for real-time communication. It provides RESTful API endpoints for CRUD operations and WebSocket events for real-time updates, handling everything from authentication to system monitoring and network scanning.

## Technology Stack

- **Django**: Web framework for APIs and business logic
- **Socket.IO**: Real-time communication
- **Python Libraries**:
  - python-nmap: Network scanning
  - scapy: Packet manipulation
  - pyroute2: Network interface inspection
  - psutil: System metrics collection

## Environment Configuration

The backend uses environment variables for configuration, which are loaded via python-dotenv. The environment variables are read from a `.env` file located in the project root. This approach allows for configuration changes without modifying code and improves security by keeping sensitive data separate from the codebase.

```python
# Example of environment variable usage in settings.py
import os
import dotenv
from django.core.management.utils import get_random_secret_key

# Load environment variables from .env file
dotenv.load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env'))

# Use environment variables
SECRET_KEY = os.environ.get('SECRET_KEY', get_random_secret_key())
DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split(',')
```

Key backend environment variables include:

| Category | Variables | Purpose |
|----------|-----------|---------|
| **Core Django** | `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS` | Basic Django configuration |
| **Redis** | `REDIS_HOST`, `REDIS_PORT` | Configuration for Redis (used by Channels) |
| **JWT** | `JWT_ACCESS_TOKEN_LIFETIME_HOURS`, `JWT_REFRESH_TOKEN_LIFETIME_DAYS` | JWT authentication settings |
| **CORS** | `CORS_ALLOW_ALL_ORIGINS`, `CORS_ALLOW_CREDENTIALS` | Cross-Origin Resource Sharing |
| **Server** | `API_HOST`, `API_PORT`, `EVERYST_DEV` | API server configuration |
| **Logging** | `METRICS_LOG_LEVEL` | Logging verbosity control |

For a complete reference, see the [Environment Variables Guide](../getting-started/environment-variables.md).

## Directory Structure

```
backend/
├── db.sqlite3           # SQLite database file
├── manage.py            # Django management script
├── run_server.py        # Custom server runner
├── api/                 # Main Django application
│   ├── __init__.py      # Package initialization
│   ├── admin.py         # Admin panel configuration
│   ├── apps.py          # App configuration
│   ├── permissions.py   # Top-level permissions
│   ├── urls.py          # URL routing
│   ├── management/      # Django management commands
│   ├── middlewares/     # Custom middleware components
│   │   ├── __init__.py
│   │   ├── auth_middleware.py
│   │   ├── cors_middleware.py
│   │   └── logging_middleware.py
│   ├── migrations/      # Database migrations
│   ├── models/          # Data models
│   │   ├── __init__.py  # Models aggregation
│   │   ├── base.py      # Base model class
│   │   ├── network.py   # Network-related models
│   │   ├── notification.py # Notification models
│   │   ├── role.py      # User role models
│   │   ├── system.py    # System metrics models
│   │   └── user.py      # User authentication models
│   ├── permissions/     # Permission classes
│   │   ├── __init__.py
│   │   ├── access_permissions.py
│   │   └── role_permissions.py
│   ├── serializers/     # REST serializers
│   │   ├── __init__.py
│   │   ├── network.py
│   │   ├── notification.py
│   │   ├── system.py
│   │   └── user.py
│   ├── services/        # Business logic services
│   │   ├── __init__.py
│   │   └── network_scanner.py
│   ├── sockets/         # Socket.IO implementation
│   │   └── ...          # Socket event handlers
│   ├── tests/           # Test cases
│   │   └── ...
│   ├── utils/           # Utility functions
│   │   └── ...
│   └── views/           # API view controllers
│       └── ...
└── everyst_api/         # Django project settings
    ├── __init__.py
    ├── asgi.py          # ASGI configuration (Socket.IO)
    ├── settings.py      # Django settings
    ├── urls.py          # Root URL configuration
    └── wsgi.py          # WSGI configuration
```

## Core Components

### Models

The data layer is organized into domain-specific models:

1. **Base Models** (`models/base.py`):
   - Shared fields and methods for all models

2. **User Models** (`models/user.py`):
   - User authentication and profile information
   - Custom user manager

3. **Role Models** (`models/role.py`):
   - Role-based access control system

4. **Network Models** (`models/network.py`):
   - Network devices, connections, and scan results

5. **System Models** (`models/system.py`):
   - System metrics, alerts, and security status

6. **Notification Models** (`models/notification.py`):
   - User notifications and system alerts

### API Views

API endpoints are organized by domain:

1. **Authentication Views**:
   - Login/logout, registration, token refresh

2. **User Management Views**:
   - CRUD operations for users and roles

3. **Network Views**:
   - Device management, network topology

4. **System Monitoring Views**:
   - System metrics, alerts, status

5. **Network Tools Views**:
   - Network diagnostic tools and utilities

### WebSocket Implementation

The Socket.IO integration provides real-time features:

1. **Socket Server** (`sockets/server.py`):
   - Core Socket.IO server configuration

2. **Authentication** (`sockets/auth.py`):
   - Socket connection authentication

3. **Event Handlers** (`sockets/events.py`):
   - WebSocket event processing

4. **System Metrics** (`sockets/metrics.py`):
   - Real-time metrics broadcasting

5. **Network Events** (`sockets/network.py`):
   - Network scanning and updates

### Services

Business logic is organized into services:

1. **Network Scanner** (`services/network_scanner.py`):
   - Network discovery and device scanning
   - Asynchronous scanning operations
   - Device fingerprinting

## Authentication Flow

1. **JWT Authentication**:
   - User submits credentials to `/api/auth/login/`
   - Backend verifies credentials and issues access/refresh tokens
   - Client includes token in Authorization header for subsequent requests
   - Token refresh mechanism for extended sessions

2. **WebSocket Authentication**:
   - Socket connection includes token in query parameter or payload
   - Authentication middleware validates token
   - Socket connection is associated with authenticated user

## Permission System

Role-based access control is implemented with:

1. **User Roles**:
   - Predefined roles (admin, user, viewer)
   - Custom permission sets

2. **Permission Classes**:
   - Django Rest Framework permission classes
   - Custom permission checks

3. **Access Control**:
   - View-level permissions
   - Object-level permissions
   - Function-level access control

## Network Scanning Architecture

The network scanner service provides:

1. **Scan Types**:
   - Basic scan: Fast scan with limited fingerprinting
   - Intense scan: More thorough with OS detection
   - Full scan: Complete port and service scanning

2. **Scanning Process**:
   - Initial discovery via ARP and ping
   - Detailed scanning via Nmap
   - Connection inference from network topology
   - Result storage and frontend notification

## Real-time Metrics Collection

System metrics are collected and broadcast:

1. **Collection Process**:
   - Scheduled collection using psutil
   - On-demand collection for dashboard updates
   - Threshold monitoring for alerts

2. **Broadcasting**:
   - Metrics sent via Socket.IO events
   - Data rate limiting to prevent overload
   - Client-specific filtering

## Data Flow

1. **API Request Flow**:
   - Client sends HTTP request
   - Middleware processes request (auth, CORS)
   - URL router directs to appropriate view
   - View processes request with serializers
   - Database operations via ORM
   - Response formatted and returned

2. **WebSocket Event Flow**:
   - Client emits event
   - Server event handler processes event
   - Business logic executed in services
   - Results emitted to client(s)
   - Database updated as needed

## ASGI Integration

Django's ASGI configuration integrates Socket.IO:

```python
# everyst_api/asgi.py
import os
import socketio
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'everyst_api.settings')

# Import Socket.IO server instance
from api.sockets import socket_app

# Create ASGI application
django_app = get_asgi_application()

# Create combined application
application = socketio.ASGIApp(
    socket_app,
    django_app,
    socketio_path='socket.io'
)
```

## Database Schema

The primary models and their relationships:

1. **User**:
   - Authentication credentials
   - Profile information
   - Role association

2. **UserRole**:
   - Role name and description
   - Permission mappings

3. **NetworkDevice**:
   - Device identification
   - Network information
   - Status and metadata

4. **NetworkConnection**:
   - Connection between devices
   - Connection properties
   - Status information

5. **NetworkScan**:
   - Scan metadata
   - Timestamp information
   - Results reference

6. **SystemMetrics**:
   - Performance data points
   - Resource utilization
   - Timestamp information

7. **Notification**:
   - Message content
   - Type and severity
   - User targeting
   - Status (read/unread)

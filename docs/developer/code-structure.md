# Code Structure

This document provides an overview of Everyst's code structure to help developers understand the organization of the codebase.

## Project Structure Overview

```
Everyst/
├── backend/            # Django backend
│   ├── api/            # Main Django app
│   └── everyst_api/    # Django project settings
├── docs/               # Documentation
├── public/             # Static assets
├── scripts/            # Utility scripts
├── src/                # Frontend source code
├── package.json        # Frontend dependencies
├── requirements.txt    # Backend dependencies
├── setup-dev.sh        # Development setup script
└── install.sh          # Production installation script
```

## Backend Structure

The backend is built with Django and follows a modular structure:

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
│   ├── migrations/      # Database migrations
│   ├── models/          # Data models
│   ├── permissions/     # Permission classes
│   ├── serializers/     # REST serializers
│   ├── services/        # Business logic services
│   ├── sockets/         # Socket.IO implementation
│   ├── tests/           # Test cases
│   ├── utils/           # Utility functions
│   └── views/           # API view controllers
└── everyst_api/         # Django project settings
    ├── __init__.py
    ├── asgi.py          # ASGI configuration (Socket.IO)
    ├── settings.py      # Django settings
    ├── urls.py          # Root URL configuration
    └── wsgi.py          # WSGI configuration
```

### Key Backend Components

#### Models

Models are organized by domain and located in `backend/api/models/`:

- `base.py`: Base model with common fields
- `user.py`: User authentication models
- `network.py`: Network-related models
- `system.py`: System metrics models
- `notification.py`: Notification models

#### Views and API Endpoints

Views are organized in `backend/api/views/`:

- `auth.py`: Authentication views
- `network.py`: Network-related views
- `system.py`: System monitoring views
- `user.py`: User management views

#### Socket.IO Implementation

WebSocket functionality is in `backend/api/sockets/`:

- `server.py`: Socket.IO server configuration
- `auth.py`: WebSocket authentication
- `events.py`: Event handlers
- `metrics.py`: System metrics broadcasting
- `network.py`: Network-related events

#### Services

Business logic is encapsulated in service classes in `backend/api/services/`:

- `network_scanner.py`: Network discovery and scanning

#### Utilities

Helper functions and utilities in `backend/api/utils/`:

- `system.py`: System metrics collection
- `security.py`: Security-related utilities

## Frontend Structure

The frontend is built with React, TypeScript, and Vite:

```
src/
├── App.tsx             # Main application component
├── main.tsx            # Entry point
├── index.css           # Global styles
├── assets/             # Static assets
├── components/         # Reusable UI components
│   ├── auth/           # Authentication components
│   ├── climbers/       # User management components
│   ├── layout/         # Layout components
│   ├── skeletons/      # Loading state components
│   └── ui/             # Basic UI components
├── context/            # React contexts
│   ├── AuthContext.tsx         # Authentication context
│   ├── NotificationContext.tsx # Notification system
│   ├── ThemeContext.tsx        # Theme management
│   └── WebSocketContext.tsx    # Socket.IO connection
├── hooks/              # Custom React hooks
│   ├── useTheme.tsx    # Theme hook
│   └── state/          # State management hooks
├── pages/              # Page components
│   ├── account/        # User account pages
│   ├── auth/           # Authentication pages
│   ├── basecamp/       # Service integration pages
│   ├── climbers/       # User management pages
│   ├── gearroom/       # Network tools pages
│   ├── glacier/        # Network visualization pages
│   └── summit/         # Dashboard pages
├── types/              # TypeScript type definitions
│   ├── network.ts      # Network-related types
│   ├── notifications.ts # Notification types
│   └── users.ts        # User-related types
└── utils/              # Utility functions
    ├── gearRoomApi.ts  # Network tools API
    ├── networkTools.ts # Network utilities
    └── socket.ts       # Socket.IO utilities
```

### Key Frontend Components

#### Core Components

- `Layout.tsx`: Main application layout structure
- `Sidebar.tsx`: Navigation sidebar
- `Header.tsx`: Top navigation bar

#### Page Components

Each major feature has a dedicated page component:

- `SummitDashboard.tsx`: Main dashboard
- `GlacierNetworkMap.tsx`: Network visualization
- `GearRoomTools.tsx`: Network diagnostic tools
- `BasecampIntegrations.tsx`: Service integrations
- `ClimbersUserManagement.tsx`: User management

#### Context Providers

Application state is managed with React Context:

- `AuthContext.tsx`: Authentication state and methods
- `WebSocketContext.tsx`: Socket.IO connection and events
- `NotificationContext.tsx`: Global notification system
- `ThemeContext.tsx`: Theme management

#### UI Components

Reusable UI components in `src/components/ui/`:

- `Card.tsx`: Content container component
- `Panel.tsx`: Section wrapper component
- `IconButton.tsx`: Button with icon and tooltip
- `StatusPill.tsx`: Status indicator component
- `ToolCard.tsx`: Card for network tools
- `Card.tsx`: Card component
- `Modal.tsx`: Modal component

## Configuration Files

### Backend Configuration

- `backend/everyst_api/settings.py`: Django settings
- `backend/everyst_api/.env`: Environment variables (not in repo)

### Frontend Configuration

- `vite.config.ts`: Vite build configuration
- `.env`: Environment variables (not in repo)
- `tailwind.config.js`: Tailwind CSS configuration
- `tsconfig.json`: TypeScript configuration

## Documentation Structure

Documentation is organized in the `docs/` directory:

```
docs/
├── README.md                         # Documentation index
├── introduction.md                   # Project overview
├── api_endpoints.md                  # API reference
├── websocket_events.md               # WebSocket events reference
├── architecture/                     # Architecture documentation
│   ├── system-overview.md            # System architecture
│   ├── frontend.md                   # Frontend architecture
│   └── backend.md                    # Backend architecture
├── getting-started/                  # Setup guides
│   ├── installation.md               # Installation guide
│   ├── configuration.md              # Configuration guide
│   └── first-run-setup.md            # First run instructions
├── user-guide/                       # User documentation
│   ├── summit-dashboard.md           # Dashboard guide
│   ├── glacier-network.md            # Network visualization guide
│   ├── gearroom-tools.md             # Network tools guide
│   ├── basecamp-integrations.md      # Integrations guide
│   └── climbers-user-management.md   # User management guide
├── api/                              # API documentation
│   └── data-models.md                # Data models reference
└── developer/                        # Developer guides
    ├── setup.md                      # Dev environment setup
    ├── code-structure.md             # Code organization
    └── contributing.md               # Contribution guide
```

## Data Flow

### Authentication Flow

1. `src/pages/auth/LoginPage.tsx`: User enters credentials
2. `src/context/AuthContext.tsx`: Makes login request to API
3. `backend/api/views/auth.py`: Validates credentials and issues JWT
4. `src/context/AuthContext.tsx`: Stores token in local storage
5. `src/components/auth/ProtectedRoute.tsx`: Checks authentication for routes

### Real-time Data Flow

1. `src/context/WebSocketContext.tsx`: Establishes WebSocket connection
2. `backend/api/sockets/server.py`: Authenticates connection
3. `backend/api/sockets/metrics.py`: Collects and emits system metrics
4. `src/pages/summit/SummitDashboard.tsx`: Receives and displays metrics

### Network Visualization Flow

1. `src/pages/glacier/GlacierNetworkMap.tsx`: User requests network scan
2. `src/utils/socket.ts`: Emits scan request event
3. `backend/api/sockets/network.py`: Receives request and initiates scan
4. `backend/api/services/network_scanner.py`: Performs network scan
5. `backend/api/sockets/network.py`: Emits scan results
6. `src/pages/glacier/GlacierNetworkMap.tsx`: Updates network visualization

## Module Dependencies

### Backend Dependencies

Key backend dependencies include:
- Django: Web framework
- Django REST Framework: API toolkit
- python-socketio: Socket.IO server
- python-nmap: Network scanning
- psutil: System metrics collection

### Frontend Dependencies

Key frontend dependencies include:
- React: UI library
- TypeScript: Type safety
- Vite: Build tool
- Socket.IO Client: Real-time communication
- React Router: Routing
- Framer Motion: Animations
- Tailwind CSS: Styling
- ReactFlow: Network visualization
- Lucide Icons: Icon set
- React Query: Data fetching and caching

## Entry Points

### Backend Entry Points

- `backend/manage.py`: Django management commands
- `backend/run_server.py`: ASGI server runner
- `backend/everyst_api/asgi.py`: ASGI application definition

### Frontend Entry Points

- `src/main.tsx`: Application bootstrap
- `src/App.tsx`: Root component and routing setup

## Build System

- Frontend: Vite (configured in `vite.config.ts`)
- Backend: Django's built-in tooling
- Production: Build script in `install.sh`

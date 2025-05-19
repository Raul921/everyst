# System Overview

## High-Level Architecture

Everyst follows a client-server architecture with a clear separation between the frontend and backend components.

```
┌──────────────┐       ┌────────────────┐
│              │       │                │
│   Frontend   │◄─────►│    Backend     │
│  (React/TS)  │       │    (Django)    │
│              │       │                │
└──────────────┘       └────────────────┘
       ▲                      ▲
       │                      │
       ▼                      ▼
┌──────────────┐       ┌────────────────┐
│   Browser    │       │   System API   │
│    Client    │       │    (Linux)     │
└──────────────┘       └────────────────┘
```

## Configuration Management

Everyst uses environment variables for configuration management, allowing deployment settings to be customized without code changes:

```
┌────────────────┐       ┌────────────────┐
│                │       │                │
│    .env file   ├──────►│  Django/Vite   │
│                │       │  Configuration  │
└────────────────┘       └────────────────┘
```

Environment variables control everything from database settings to UI behavior. The system uses:

- **python-dotenv**: For loading backend environment variables
- **Vite env vars**: For frontend configuration (prefixed with `VITE_`)
- **Environment-specific settings**: Different values for development and production

See the [Environment Variables Guide](../getting-started/environment-variables.md) for details.

## Communication Flow

1. **HTTP API Communication**
   - RESTful API for CRUD operations
   - JWT authentication for security
   - API endpoints for data retrieval and manipulation

2. **WebSocket Communication**
   - Real-time data updates via Socket.IO
   - Bidirectional communication
   - Event-driven architecture
   - Used for metrics streaming, notifications, and real-time features

3. **System Integration**
   - Backend interfaces with the host system
   - Collection of system metrics
   - Execution of network tools
   - Scanning and monitoring operations

## Component Interaction

```
┌─────────────────────────────────────────────────────────┐
│                       Frontend                          │
├─────────────┬──────────────────────┬───────────────────┤
│  Components │      Contexts        │     Utilities     │
│             │                      │                   │
│  - Layout   │  - AuthContext       │  - API clients    │
│  - UI       │  - WebSocketContext  │  - Socket utils   │
│  - Pages    │  - NotificationCtx   │  - Formatters     │
│  - Features │  - ThemeContext      │  - Type defs      │
└─────┬───────┴──────────┬───────────┴────────┬──────────┘
      │                  │                    │
      ▼                  ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│                        Backend                          │
├─────────────┬──────────────────────┬───────────────────┤
│    API      │     WebSockets       │     Services      │
│             │                      │                   │
│  - Views    │  - Socket.IO server  │  - Network scanner│
│  - Models   │  - Event handlers    │  - System metrics │
│  - URLs     │  - Authentication    │  - Security tools │
└─────────────┴──────────────────────┴───────────────────┘
```

## Data Flow

1. **User Authentication Flow**
   - User submits credentials
   - Backend validates and issues JWT tokens
   - Frontend stores tokens for subsequent requests
   - WebSocket uses tokens for connection authentication

2. **Dashboard Data Flow**
   - Initial data loaded via REST API
   - Live updates received via WebSockets
   - User interactions trigger API calls
   - Backend processes and responds

3. **Network Scanning Flow**
   - User initiates scan from frontend
   - Request sent via WebSocket
   - Backend initiates scanning service
   - Progress updates sent via WebSockets
   - Results stored in database
   - Final visualization displayed to user

## File Structure Organization

The project follows a modular organization pattern:

- Frontend components are organized by feature
- Backend code is organized by domain and function
- Shared utilities and common code are centralized

## Technology Stack Integration

- **Django**: Powers the backend API, models, views
- **Socket.IO**: Integrated with Django's ASGI for real-time communication
- **React**: Frontend view layer and component system
- **TypeScript**: Type safety throughout the frontend
- **SQLite**: Default database (configurable)
- **Tailwind CSS**: Utility-first CSS framework for styling

## Security Architecture

- JWT token-based authentication
- Role-based access control
- Protected routes and API endpoints
- WebSocket authentication
- Input validation and sanitization

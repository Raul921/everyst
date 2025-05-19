# Frontend Architecture

## Overview

The frontend of Everyst is built with React, TypeScript, and Vite, providing a modern, responsive interface for managing server resources. It uses a component-based architecture with a focus on reusability, type safety, and performance.

## Technology Stack

- **React**: Component-based UI library
- **TypeScript**: Adds static type checking to JavaScript
- **Vite**: Build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Framer Motion**: Animation library
- **Socket.IO Client**: Real-time communication
- **React Query**: Data fetching and caching
- **Lucide Icons**: Icon library

## Directory Structure

```
src/
├── App.tsx             # Main application component
├── main.tsx            # Entry point
├── index.css           # Global styles
├── vite-env.d.ts       # Vite type definitions
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
│   ├── svg.d.ts        # SVG import types
│   └── users.ts        # User-related types
└── utils/              # Utility functions
    ├── gearRoomApi.ts  # Network tools API
    ├── networkTools.ts # Network utilities
    └── socket.ts       # Socket.IO utilities
```

## Core Components

### Layout Components

- **Layout.tsx**: Main application layout with sidebar, header, and content area
- **Header.tsx**: Top navigation bar with search, user menu, and notifications
- **Sidebar.tsx**: Navigation sidebar with collapsible menu

### UI Components

- **Card**: Container component with consistent styling
- **Panel**: Section wrapper with title and collapsible content
- **IconButton**: Button with icon and tooltip
- **Modal**: Dialog component for forms and confirmations
- **StatusPill**: Status indicator with color coding
- **ToolCard**: Specialized card for network tools

### Context Providers

```
App
├── QueryClientProvider
│   └── ThemeProvider
│       └── WebSocketProvider
│           └── AuthProvider
│               └── NotificationProvider
│                   └── Router (Application Routes)
```

### Page Structure

Each major feature has its own directory under `pages/` with related components:

- **Summit**: Dashboard overview with system metrics
- **Glacier**: Network visualization and device management
- **GearRoom**: Network diagnostic tools
- **Basecamp**: Service integrations
- **Climbers**: User management

## Environment Configuration

The frontend uses environment variables for configuration, following Vite's convention of prefixing variables with `VITE_`:

```
# Frontend Environment Variables
VITE_API_URL=https://localhost:8000/api       # Backend API endpoint
VITE_SOCKET_URL=https://localhost:8000        # WebSocket server URL
VITE_ENVIRONMENT=development                  # Current environment
```

These variables are accessed in the code using Vite's `import.meta.env` object:

```typescript
// Example usage in code
const apiUrl = import.meta.env.VITE_API_URL;
const isDevelopment = import.meta.env.VITE_ENVIRONMENT === 'development';
```

Environment variables are loaded from the `.env` file at the project root. See the [Environment Variables Guide](../getting-started/environment-variables.md) for more details.

## State Management

Everyst uses a combination of state management approaches:

1. **React Context**: For global state (auth, theme, notifications)
2. **React Query**: For remote data fetching and caching
3. **Local Component State**: For UI state
4. **Custom Hooks**: For shared logic and derived state

## Data Flow

1. **API Data Flow**:
   - React Query hooks fetch data from API endpoints
   - Components consume data via hooks
   - Mutations update server data
   - Cache invalidation triggers refetching

2. **WebSocket Data Flow**:
   - WebSocketContext establishes connection
   - Components subscribe to relevant events
   - Real-time updates trigger state changes
   - UI reflects changes immediately

## Routing

React Router handles client-side routing with protected routes:

```tsx
<Routes>
  {/* Public Routes */}
  <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
  <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
  
  {/* Protected Routes */}
  <Route path="/" element={<ProtectedRoute />}>
    <Route index element={<Navigate to="/summit" replace />} />
    <Route path="summit" element={<SummitDashboard />} />
    <Route path="network-map" element={<GlacierNetworkMap />} />
    {/* Additional routes... */}
  </Route>
</Routes>
```

## Styling Approach

Everyst uses Tailwind CSS with a custom theme:

- CSS variables for theme colors and values
- Dark/light mode support via ThemeContext
- Responsive design for various screen sizes
- Animation with Framer Motion
- Consistent UI components

## Features Implementation

### Authentication

- JWT-based authentication via AuthContext
- Protected routes with ProtectedRoute component
- Role-based access control with PermissionGate component

### Real-time Updates

- WebSocket connection managed by WebSocketContext
- Socket.IO client for bidirectional communication
- Event-based architecture for real-time data

### Notifications

- Global notification system via NotificationContext
- Toast-style notifications with different severity levels
- WebSocket-driven system notifications

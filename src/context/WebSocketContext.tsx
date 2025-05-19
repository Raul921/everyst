import React, { createContext, useContext, useEffect, useState } from 'react';
import { socketService } from '../utils/socket';
import type { NotificationPayload } from '../types/notifications';

interface WebSocketContextValue {
  isConnected: boolean;
  isAuthenticated: boolean;
  connect: (token?: string) => Promise<boolean>;
  authenticate: (token: string) => Promise<boolean>;
  disconnect: () => void;
}

// Create context with default values
const WebSocketContext = createContext<WebSocketContextValue>({
  isConnected: false,
  isAuthenticated: false,
  connect: async () => false,
  authenticate: async () => false,
  disconnect: () => {},
});

export const WebSocketProvider: React.FC<{
  children: React.ReactNode;
  onNotification?: (notification: NotificationPayload) => void;
}> = ({ children, onNotification }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Connect to the WebSocket server - requires authentication token
  const connect = async (token?: string) => {
    // We need a token for secure connection
    if (!token) {
      console.warn('Cannot connect to WebSocket without authentication token');
      setIsConnected(false);
      return false;
    }
    
    // If we're already connected with the same token, just return true
    if (isConnected && socketService.isConnected() && token === socketService.getAuthToken()) {
      return true;
    }

    try {
      // Connect with token for authentication
      const connected = await socketService.init(token);
      setIsConnected(connected);
      
      if (connected) {
        setIsAuthenticated(true); // We're authenticated if connection succeeds
      }
      
      return connected;
    } catch (error) {
      console.error('Failed to connect to WebSocket server:', error);
      setIsConnected(false);
      return false;
    }
  };

  // Authenticate with the WebSocket server - mostly handled during connection now
  const authenticate = async (token: string) => {
    // Connection and authentication are now combined for simplicity
    // This method exists primarily for backward compatibility
    
    if (!isConnected) {
      // If not connected, connect will handle both connection and authentication
      return await connect(token);
    }

    try {
      // If already connected, verify the authentication
      const response = await socketService.authenticate(token);
      const success = response?.status === 'success';
      setIsAuthenticated(success);
      
      if (!success) {
        // If authentication fails, disconnect for security
        disconnect();
      }
      
      return success;
    } catch (error) {
      console.error('WebSocket explicit authentication failed:', error);
      // For security, disconnect on authentication failure
      disconnect();
      setIsAuthenticated(false);
      return false;
    }
  };

  // Disconnect from the WebSocket server
  const disconnect = () => {
    socketService.disconnect();
    setIsConnected(false);
    setIsAuthenticated(false);
  };

  // Set up notification handler if provided
  useEffect(() => {
    if (onNotification) {
      socketService.onNotification(onNotification);
    }
  }, [onNotification]);

  // Set up socket event listeners
  useEffect(() => {
    // Set up socket connection state change listeners
    const onConnect = () => {
      setIsConnected(true);
    };
    
    const onDisconnect = () => {
      setIsConnected(false);
      // Reset authentication state on disconnect for security
      setIsAuthenticated(false);
    };
    
    // Add socket-level event listeners
    socketService.addEventListeners({
      onConnect,
      onDisconnect
    });
    
    // Check initial connection state
    setIsConnected(socketService.isConnected());
    setIsAuthenticated(socketService.isAuthenticated());
    
    // Don't automatically connect on mount - wait for explicit authentication
    // This ensures no unauthenticated connections
    // (The old code tried to connect() with no token, which will now fail)
    
    return () => {
      // Only remove event listeners, don't disconnect the socket
      socketService.removeEventListeners({
        onConnect,
        onDisconnect
      });
    };
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        isAuthenticated,
        connect,
        authenticate,
        disconnect,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

// Custom hook to use the WebSocket context
export function useWebSocket() {
  const context = useContext(WebSocketContext);
  
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  
  return context;
}
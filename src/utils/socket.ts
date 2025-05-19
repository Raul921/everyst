import { io, Socket } from "socket.io-client";
import type { SocketOptions } from "socket.io-client";
import type { NotificationPayload } from "../types/notifications";

// Interface for notification response from socket
interface SocketResponse {
  status: 'success' | 'error';
  message?: string;
  user_id?: string;
}

// Custom Socket.IO options interface that includes extraHeaders and query
interface CustomSocketOptions extends Partial<SocketOptions> {
  path?: string;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  timeout?: number;
  autoConnect?: boolean;
  transports?: string[];
  forceNew?: boolean;
  extraHeaders?: {
    [key: string]: string;
  };
  query?: {
    [key: string]: string;
  };
}

// Socket event listeners interface
interface SocketEventListeners {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onConnectError?: (error: Error) => void;
  onReconnectAttempt?: (attemptNumber: number) => void;
}

// Get the API URL - using environment variable with fallback to relative path
const getApiUrl = () => {
  // Use environment variable if available, otherwise use relative path
  return import.meta.env.VITE_API_URL || `/api`;
};

// Get the socket URL - using environment variable with fallback to relative path
const getSocketUrl = () => {
  // For local development, just use a relative path to leverage Vite's proxy
  if (import.meta.env.DEV) {
    return '';  // Empty string makes Socket.IO use the current page's origin
  }
  // Use environment variable for production deployments
  return import.meta.env.VITE_SOCKET_URL || '';
};

// Global callback for broadcast notifications - used for system notifications
let globalNotificationCallback: ((notification: NotificationPayload) => void) | null = null;

// Socket service for handling socket.io connections
class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private authToken: string | null = null;
  private notificationCallback: ((notification: NotificationPayload) => void) | null = null;
  private connectionAttempts: number = 0;
  private maxReconnectionAttempts: number = 5; // Increased from 3
  private isConnecting: boolean = false;
  private eventListeners: SocketEventListeners = {};

  // Add event listeners to the socket
  addEventListeners(listeners: SocketEventListeners): void {
    this.eventListeners = { ...this.eventListeners, ...listeners };
    
    // Apply listeners if socket exists
    if (this.socket) {
      if (listeners.onConnect) {
        this.socket.on('connect', listeners.onConnect);
      }
      
      if (listeners.onDisconnect) {
        this.socket.on('disconnect', listeners.onDisconnect);
      }
      
      if (listeners.onConnectError) {
        this.socket.on('connect_error', listeners.onConnectError);
      }
    }
  }

  // Remove event listeners from the socket
  removeEventListeners(listeners: SocketEventListeners): void {
    if (!this.socket) return;
    
    if (listeners.onConnect) {
      this.socket.off('connect', listeners.onConnect);
    }
    
    if (listeners.onDisconnect) {
      this.socket.off('disconnect', listeners.onDisconnect);
    }
    
    if (listeners.onConnectError) {
      this.socket.off('connect_error', listeners.onConnectError);
    }
    
    // Clean up the stored listeners object
    Object.keys(listeners).forEach((key) => {
      const k = key as keyof SocketEventListeners;
      if (listeners[k] && this.eventListeners[k] === listeners[k]) {
        delete this.eventListeners[k];
      }
    });
  }

  // Initialize the socket connection - requires a valid token
  init(token?: string): Promise<boolean> {
    return new Promise((resolve) => {
      // Enforce authentication - no token means no connection
      if (!token && !this.authToken) {
        console.warn('Socket connection rejected: No authentication token provided');
        resolve(false);
        return;
      }
      
      // Store the current token for comparison
      const currentToken = this.authToken;
      
      // If token is provided but hasn't changed, reuse the existing connection
      if (token && token === currentToken && this.socket?.connected) {
        resolve(true);
        return;
      }
      
      // Validate token format before attempting connection
      if (token) {
        try {
          // Simple check to see if token has valid JWT format (header.payload.signature)
          const tokenParts = token.split('.');
          if (tokenParts.length !== 3) {
            console.warn('Invalid JWT token format, rejecting socket connection');
            resolve(false);
            return;
          }
        } catch (tokenFormatErr) {
          console.warn('Error parsing token for socket connection:', tokenFormatErr);
          resolve(false);
          return;
        }
        this.authToken = token;
      }
      
      // If already connected, we can reuse the socket in most cases
      if (this.socket?.connected) {
        // Only reconnect if the token has changed
        if (this.authToken === currentToken) {
          resolve(true);
          return;
        }
      }
      
      // If connection is in progress, don't start another one
      if (this.isConnecting) {
        console.debug('Socket initialization already in progress');
        resolve(false);
        return;
      }
      
      // Clean up any existing socket before creating a new one
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
      
      this.isConnecting = true;
      
      try {
        // When using development with HTTPS, we need to use a relative URL
        // to leverage Vite's proxy configuration for both HTTP and WebSocket
        const options: CustomSocketOptions = {
          path: '/socket.io/',
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000,
          autoConnect: true,
          transports: ['websocket', 'polling'],
          forceNew: true
        };
        
        // Always add auth headers (we've enforced token requirement)
        options.extraHeaders = {
          Authorization: `Bearer ${this.authToken || ''}`
        };
        // Also add auth in the query parameters for better compatibility with django channels
        options.query = {
          token: this.authToken || ''
        };
        
        // Create the socket connection using the environment variable or fallback to relative URL
        this.socket = io(getSocketUrl(), options);

        // Setup connection handlers
        this.socket.on('connect', () => {
          this.connectionAttempts = 0;
          this.isConnecting = false;
          
          // Call the onConnect event listener
          if (this.eventListeners.onConnect) {
            this.eventListeners.onConnect();
          }
          
          // For legacy support - Register the user if a user ID is set
          if (this.userId) {
            this.registerUser(this.userId);
          }
          
          console.debug('[Socket] Connection established successfully');
          resolve(true);
        });

        this.socket.on('connect_error', (error: Error) => {
          console.warn(`[Socket] Connection error (attempt ${this.connectionAttempts + 1}/${this.maxReconnectionAttempts}):`, error.message);
          console.debug('[Socket] Full error details:', error);
          this.connectionAttempts++;
          
          // Call the onConnectError event listener
          if (this.eventListeners.onConnectError) {
            this.eventListeners.onConnectError(error);
          }
          
          // Call the onReconnectAttempt event listener
          if (this.eventListeners.onReconnectAttempt) {
            this.eventListeners.onReconnectAttempt(this.connectionAttempts);
          }
          
          if (this.connectionAttempts >= this.maxReconnectionAttempts) {
            console.warn(`[Socket] Failed to connect after ${this.maxReconnectionAttempts} attempts. Using fallback mode.`);
            this.isConnecting = false;
            resolve(false);
          }
        });

        this.socket.on('notification', (notification: NotificationPayload) => {
          console.debug('[Socket] Notification received:', notification);
          
          // Always call the instance callback if it exists
          if (this.notificationCallback) {
            this.notificationCallback(notification);
          }
          
          // Also call the global callback for system notifications
          if (globalNotificationCallback) {
            globalNotificationCallback(notification);
          }
        });

        this.socket.on('disconnect', () => {
          console.debug('[Socket] Disconnected');
          
          // Call the onDisconnect event listener
          if (this.eventListeners.onDisconnect) {
            this.eventListeners.onDisconnect();
          }
        });
        
        // Set a timeout in case connection hangs
        setTimeout(() => {
          if (this.isConnecting) {
            console.warn('[Socket] Connection attempt timed out');
            this.isConnecting = false;
            resolve(false);
          }
        }, 8000);
        
      } catch (error) {
        console.error('[Socket] Failed to initialize:', error);
        this.isConnecting = false;
        resolve(false);
      }
    });
  }

  // Authenticate with the server using JWT token
  authenticate(token: string): Promise<SocketResponse> {
    return new Promise((resolve) => {
      // Don't try to authenticate if we don't have a connection
      if (!this.socket || !this.socket.connected) {
        console.error('Socket not connected, cannot authenticate');
        resolve({ status: 'error', message: 'Socket not connected' });
        return;
      }
      
      // Validate token format before attempting authentication
      try {
        // Simple check to see if token has valid JWT format (header.payload.signature)
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          console.warn('Invalid JWT token format, rejecting socket authentication');
          this.disconnect();
          resolve({ status: 'error', message: 'Invalid token format' });
          return;
        }
        // Update the token
        this.authToken = token;
      } catch (tokenFormatErr) {
        console.warn('Error parsing token for socket authentication:', tokenFormatErr);
        this.disconnect();
        resolve({ status: 'error', message: 'Invalid token format' });
        return;
      }
      
      try {
        // Send explicit authentication message to the server
        this.socket.emit('authenticate', { token }, (response: SocketResponse) => {
          if (response?.status === 'success') {
            this.userId = response.user_id || null;
            console.debug('Socket authenticated successfully');
            resolve(response);
          } else {
            console.warn('Socket authentication failed:', response?.message || 'Unknown error');
            // Disconnect on authentication failure for security
            this.disconnect();
            resolve({ status: 'error', message: response?.message || 'Authentication failed' });
          }
        });
      } catch (error) {
        console.error('Socket authentication error:', error);
        this.disconnect();
        resolve({ status: 'error', message: 'Socket authentication error' });
      }
    });
  }

  // Check if socket is connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.authToken && !!this.userId;
  }
  
  // Get token currently used for socket connection
  getAuthToken(): string | null {
    return this.authToken;
  }

  // Set user ID and register with the socket server (legacy support)
  setUserId(userId: string): void {
    this.userId = userId;
    if (this.socket && this.socket.connected) {
      this.registerUser(userId);
    }
  }

  // Register the current user with the socket server (legacy support)
  private registerUser(userId: string): void {
    if (!this.socket || !this.socket.connected) return;
    
    this.socket.emit('register_user', { user_id: userId }, (response: SocketResponse) => {
      if (response?.status === 'success') {
        console.debug('User registered with socket server:', response.message); // Reduced to debug level
      } else {
        console.error('Failed to register user with socket server:', response?.message);
      }
    });
  }

  // Set callback function for handling incoming notifications
  onNotification(callback: (notification: NotificationPayload) => void): void {
    this.notificationCallback = callback;
  }
  
  // Set global callback for system notifications
  setGlobalNotificationCallback(callback: (notification: NotificationPayload) => void): void {
    globalNotificationCallback = callback;
  }

  // Send a notification to a specific user
  sendNotification(
    targetUserId: string, 
    title: string, 
    message?: string, 
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    duration: number = 5000,
    source: string = 'user'
  ): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.socket || !this.socket.connected) {
        console.warn('Socket not connected, cannot send notification');
        resolve(false);
        return;
      }

      const notification = {
        title,
        message,
        type,
        duration,
        timestamp: Date.now(),
        source
      };

      this.socket.emit('send_notification', { 
        user_id: targetUserId, 
        notification 
      }, (response: SocketResponse) => {
        if (response?.status === 'success') {
          console.debug('Notification sent:', response.message); // Reduced to debug level
          resolve(true);
        } else {
          console.error('Failed to send notification:', response?.message);
          resolve(false);
        }
      });
    });
  }

  // Broadcast a notification to all connected users
  broadcastNotification(
    title: string, 
    message?: string, 
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    duration: number = 5000,
    source: string = 'system'
  ): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.socket || !this.socket.connected) {
        console.warn('Socket not connected, cannot broadcast notification');
        resolve(false);
        return;
      }

      const notification = {
        title,
        message,
        type,
        duration,
        timestamp: Date.now(),
        source
      };

      this.socket.emit('send_notification', { notification }, (response: SocketResponse) => {
        if (response?.status === 'success') {
          console.debug('Notification broadcast:', response.message); // Reduced to debug level
          resolve(true);
        } else {
          console.error('Failed to broadcast notification:', response?.message);
          resolve(false);
        }
      });
    });
  }

  // Fetch notifications from the API
  async fetchNotifications(token: string): Promise<NotificationPayload[]> {
    try {
      const response = await fetch(`${getApiUrl()}/notifications/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }
  
  // Mark notifications as read
  async markAsRead(notificationIds: (string | number)[], token: string): Promise<boolean> {
    try {
      const response = await fetch(`${getApiUrl()}/notifications/mark_as_read/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids: notificationIds })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to mark notifications as read: ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      return false;
    }
  }
  
  // Mark all notifications as read
  async markAllAsRead(token: string): Promise<boolean> {
    try {
      const response = await fetch(`${getApiUrl()}/notifications/mark_all_as_read/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to mark all notifications as read: ${response.statusText}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }
  
  // Get unread notification count
  async getUnreadCount(token: string): Promise<number> {
    try {
      const response = await fetch(`${getApiUrl()}/notifications/unread_count/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get unread count: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.count || 0;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }
  }

  // Get the socket instance (for direct event access in components)
  getSocket(): Socket | null {
    return this.socket;
  }

  // Disconnect the socket
  disconnect(): void {
    if (this.socket) {
      console.debug('[Socket] Explicitly disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
      this.authToken = null;
    }
  }
}

// Create a singleton instance
export const socketService = new SocketService();

// Expose the socket instance globally for components that need direct access to socket events
if (typeof window !== 'undefined') {
  // Properly type the window object extension
  interface WindowWithSockets extends Window {
    socketInstance?: typeof socketService;
  }
  (window as WindowWithSockets).socketInstance = socketService;
}

// Custom hook to use the socket service with notifications
export const useSocketNotifications = (
  // Accept showNotification as a parameter instead of importing it
  showNotification: (notification: NotificationPayload) => void
) => {
  // Create wrapper functions to ensure proper 'this' binding
  const sendNotification = (
    targetUserId: string, 
    title: string, 
    message?: string, 
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    duration: number = 5000,
    source: string = 'user'
  ): Promise<boolean> => {
    return socketService.sendNotification(targetUserId, title, message, type, duration, source);
  };
  
  const broadcastNotification = (
    title: string, 
    message?: string, 
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    duration: number = 5000,
    source: string = 'system'
  ): Promise<boolean> => {
    return socketService.broadcastNotification(title, message, type, duration, source);
  };

  return {
    initializeSocket: async (token?: string): Promise<boolean> => {
      const result = await socketService.init(token);
      
      // Set up notification handling regardless of connection success
      socketService.onNotification((notification) => {
        showNotification({
          id: notification.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          duration: notification.duration,
          timestamp: notification.timestamp,
          read: notification.read || false
        });
      });
      
      return result;
    },
    
    authenticateSocket: (token: string): Promise<SocketResponse> => {
      return socketService.authenticate(token);
    },
    
    isConnected: (): boolean => {
      return socketService.isConnected();
    },
    
    isAuthenticated: (): boolean => {
      return socketService.isAuthenticated();
    },
    
    setCurrentUser: (userId: string): void => {
      socketService.setUserId(userId);
    },
    
    setGlobalNotificationCallback: (callback: (notification: NotificationPayload) => void): void => {
      socketService.setGlobalNotificationCallback(callback);
    },
    
    sendNotification,
    broadcastNotification,
    fetchNotifications: (token: string) => socketService.fetchNotifications(token),
    markAsRead: (notificationIds: (string | number)[], token: string) => socketService.markAsRead(notificationIds, token),
    markAllAsRead: (token: string) => socketService.markAllAsRead(token),
    getUnreadCount: (token: string) => socketService.getUnreadCount(token),
    disconnect: () => socketService.disconnect()
  };
};
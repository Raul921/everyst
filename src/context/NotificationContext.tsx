import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { Notification } from '../components/ui';
import type { NotificationType } from '../components/ui';
import { createPortal } from 'react-dom';
import { AnimatePresence } from 'framer-motion';
import { socketService } from '../utils/socket';
import { useWebSocket } from './WebSocketContext';
import { useAuth } from './AuthContext';
import type { NotificationItem } from '../types/notifications';

interface NotificationContextType {
  notifications: NotificationItem[];
  showNotification: (notification: Omit<NotificationItem, 'id'>) => string | number;
  removeNotification: (id: string | number) => void;
  clearAllNotifications: () => void;
  markAsRead: (id: string | number) => void;
  markAllAsRead: () => void;
  unreadCount: number;
  fetchNotifications: () => Promise<NotificationItem[]>;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  showNotification: () => '',
  removeNotification: () => {},
  clearAllNotifications: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  unreadCount: 0,
  fetchNotifications: async () => [],
  isLoading: false,
});

export const useNotifications = () => useContext(NotificationContext);

// interface ServerNotification {
  //id?: string | number;
  //title: string;
  //message?: string;
  //type: string;
  //timestamp?: number;
  //duration?: number;
  //read?: boolean;
  //is_system?: boolean;
  //source?: string;
//}

export const NotificationProvider: React.FC<{
  children: React.ReactNode;
  maxNotifications?: number;
}> = ({ children, maxNotifications = 5 }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeNotifications, setActiveNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Use Auth context for token management
  const { getAccessToken } = useAuth();
  
  // Use WebSocket context for persistent connection
  const { isConnected } = useWebSocket();

  // Set up WebSocket notification handler
  useEffect(() => {
    // Register socket notification handler
    if (isConnected) {
      socketService.onNotification((notification) => {
        showNotification({
          title: notification.title,
          message: notification.message,
          type: notification.type as NotificationType,
          duration: notification.duration,
          timestamp: notification.timestamp,
          read: notification.read || false,
          is_system: notification.is_system,
          source: notification.source
        });
        
        // Update unread count for new notifications
        if (!notification.read) {
          setUnreadCount(prev => prev + 1);
        }
      });
    }
  }, [isConnected]);

  // Fetch notifications from the server
  const fetchNotifications = useCallback(async () => {
    const token = getAccessToken();
    if (!token || !isConnected) return [];
    
    setIsLoading(true);
    try {
      const fetchedNotifications = await socketService.fetchNotifications(token);
      const typedNotifications = fetchedNotifications.map(n => ({
        ...n,
        id: n.id || `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      })) as NotificationItem[];
      
      setNotifications(typedNotifications);
      setUnreadCount(typedNotifications.filter(n => !n.read).length);
      return typedNotifications;
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, getAccessToken]);

  // Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    const token = getAccessToken();
    if (!token || !isConnected) return;
    
    try {
      const count = await socketService.getUnreadCount(token);
      setUnreadCount(count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [isConnected, getAccessToken]);

  // Mark a notification as read
  const markAsRead = useCallback(async (id: string | number) => {
    const token = getAccessToken();
    if (!token || !isConnected) return;
    
    try {
      const success = await socketService.markAsRead([id], token);
      if (success) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [isConnected, getAccessToken]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    const token = getAccessToken();
    if (!token || !isConnected) return;
    
    try {
      const success = await socketService.markAllAsRead(token);
      if (success) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [isConnected, getAccessToken]);

  // Add a new notification and return its ID
  const showNotification = useCallback(
    (notification: Omit<NotificationItem, 'id'>) => {
      const id = notification.timestamp ? 
        `notification-${notification.timestamp}` : 
        `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const fullNotification: NotificationItem = {
        ...notification,
        id,
      };
      
      // Add to active (visible) notifications
      setActiveNotifications((prevNotifications) => {
        // Add new notification at the beginning
        const updatedNotifications = [
          fullNotification, 
          ...prevNotifications,
        ];
        
        // Limit the number of concurrent notifications
        if (updatedNotifications.length > maxNotifications) {
          return updatedNotifications.slice(0, maxNotifications);
        }
        
        return updatedNotifications;
      });
      
      return id;
    },
    [maxNotifications]
  );

  // Remove a notification from the visible list
  const removeNotification = useCallback((id: string | number) => {
    setActiveNotifications((prevNotifications) =>
      prevNotifications.filter((notification) => notification.id !== id)
    );
  }, []);

  // Clear all visible notifications
  const clearAllNotifications = useCallback(() => {
    setActiveNotifications([]);
  }, []);

  // Initial fetch of notifications when auth state changes
  useEffect(() => {
    const token = getAccessToken();
    if (token && isConnected) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [isConnected, fetchNotifications, fetchUnreadCount, getAccessToken]);

  // Create context value
  const value = {
    notifications,
    showNotification,
    removeNotification,
    clearAllNotifications,
    markAsRead,
    markAllAsRead,
    unreadCount,
    fetchNotifications,
    isLoading
  };

  // Create a portal for notifications
  return (
    <NotificationContext.Provider value={value}>
      {children}
      {createPortal(
        <div
          className="fixed top-0 right-0 z-50 p-6 space-y-5 pointer-events-none max-h-[80vh] overflow-hidden flex flex-col items-end w-full max-w-[400px]"
          aria-live="polite"
        >
          <AnimatePresence mode="sync">
            {activeNotifications.map((notification) => (
              <Notification
                key={String(notification.id)}
                onClose={() => {
                  removeNotification(notification.id!);
                  if (notification.id && typeof notification.id !== 'string') {
                    markAsRead(notification.id);
                  }
                }}
                {...notification}
              />
            ))}
          </AnimatePresence>
        </div>,
        document.body
      )}
    </NotificationContext.Provider>
  );
};

// Helper hooks for common notifications
export const useToasts = () => {
  const { showNotification } = useNotifications();

  return {
    success: (title: string, message?: string, duration: number = 5000) =>
      showNotification({ title, message, type: 'success', duration }),
      
    info: (title: string, message?: string, duration: number = 5000) =>
      showNotification({ title, message, type: 'info', duration }),
      
    warning: (title: string, message?: string, duration: number = 5000) =>
      showNotification({ title, message, type: 'warning', duration }),
      
    error: (title: string, message?: string, duration: number = 8000) =>
      showNotification({ title, message, type: 'error', duration }),
      
    custom: (options: Omit<NotificationItem, 'id'>) =>
      showNotification(options),
  };
};
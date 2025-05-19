import { useCallback } from 'react';
import { socketService } from '../../utils/socket';
import { useNotifications } from '../../context/NotificationContext';
import { useWebSocket } from '../../context/WebSocketContext';

export const useNotificationsManager = () => {
  // Use the notification context instead of managing state locally
  const { 
    notifications, 
    unreadCount, 
    showNotification, 
    removeNotification, 
    clearAllNotifications,
    markAsRead,
    markAllAsRead,
    fetchNotifications,
    isLoading
  } = useNotifications();

  // Use WebSocket context for connection state
  const { isConnected } = useWebSocket();
  
  // Send a notification to a specific user via WebSocket
  const sendUserNotification = useCallback(
    async (
      userId: string, 
      title: string, 
      message?: string, 
      type: 'info' | 'success' | 'warning' | 'error' = 'info',
      duration: number = 5000
    ) => {
      // Attempt to send via WebSocket
      const sent = await socketService.sendNotification(userId, title, message, type, duration);
      
      // If socket is disconnected or sending failed, show the notification locally
      if (!sent) {
        showNotification({
          title,
          message,
          type,
          timestamp: Date.now(),
          duration
        });
      }
      
      return sent;
    }, 
    [showNotification]
  );

  // Broadcast a notification to all users via WebSocket
  const broadcastUserNotification = useCallback(
    async (
      title: string, 
      message?: string, 
      type: 'info' | 'success' | 'warning' | 'error' = 'info',
      duration: number = 5000
    ) => {
      // Attempt to broadcast via WebSocket
      const sent = await socketService.broadcastNotification(title, message, type, duration);
      
      // If socket is disconnected or sending failed, show the notification locally
      if (!sent) {
        showNotification({
          title,
          message,
          type,
          timestamp: Date.now(),
          duration
        });
      }
      
      return sent;
    },
    [showNotification]
  );

  // Add a local notification (no socket communication)
  const addLocalNotification = useCallback(
    (
      title: string,
      message?: string,
      type: 'info' | 'success' | 'warning' | 'error' = 'info',
      duration: number = 5000
    ) => {
      return showNotification({
        title,
        message,
        type,
        timestamp: Date.now(),
        duration
      });
    },
    [showNotification]
  );

  return {
    notifications,
    unreadCount,
    socketConnected: isConnected,
    isLoading,
    addNotification: addLocalNotification, // Renamed for backward compatibility
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    sendUserNotification,
    broadcastUserNotification,
    addLocalNotification,
    refreshNotifications: fetchNotifications
  };
};
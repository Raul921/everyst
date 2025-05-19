/**
 * Shared notification types for the application
 */

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationPayload {
  id?: string | number;
  title: string;
  message?: string;
  type: NotificationType;
  timestamp?: number;
  duration?: number;
  read?: boolean;
  is_system?: boolean;
  source?: string;
}

export interface NotificationItem extends NotificationPayload {
  id: string;
}

// The types are already exported individually above, so we don't need a default export
// Types are not values and can't be included in a value export
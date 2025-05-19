import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { NotificationItem } from '../../types/notifications';

interface NotificationsMenuProps {
  unreadCount?: number;
  notifications?: NotificationItem[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onRemoveNotification?: (id: string) => void;
  onClearAll?: () => void;
}

export const NotificationsMenu: React.FC<NotificationsMenuProps> = ({
  unreadCount = 0,
  notifications = [],
  onMarkAsRead,
  onMarkAllAsRead,
  onRemoveNotification,
  onClearAll,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format relative time for notifications
  const getRelativeTime = (timestamp: number): string => {
    const now = Date.now();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  // Get icon and color based on notification type
  const getNotificationStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-[rgba(var(--color-success),0.15)] text-success-light dark:text-success';
      case 'warning':
        return 'bg-[rgba(var(--color-warning),0.15)] text-warning-light dark:text-warning';
      case 'error':
        return 'bg-[rgba(var(--color-error),0.15)] text-error-light dark:text-error';
      case 'info':
      default:
        return 'bg-[rgba(var(--color-primary),0.15)] text-[rgb(var(--color-primary))]';
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Notification bell button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-[rgba(var(--color-primary),0.1)] transition-colors duration-200 group"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell size={20} className="text-[rgb(var(--color-text-secondary))] group-hover:text-[rgb(var(--color-primary))] transition-colors duration-200" />
        
        {/* Notification badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-[rgb(var(--color-primary))] rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 max-h-[400px] flex flex-col bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] rounded-lg shadow-lg overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-[rgb(var(--color-border))]">
              <h3 className="font-medium text-[rgb(var(--color-text))]">Notifications</h3>
              <div className="flex gap-2">
                {notifications.length > 0 && (
                  <>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => onMarkAllAsRead?.()}
                        className="p-1 text-xs rounded hover:bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-primary))] transition-colors"
                        title="Mark all as read"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => onClearAll?.()}
                      className="p-1 text-xs rounded hover:bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-text-secondary))] hover:text-[rgb(var(--color-primary))] transition-colors"
                      title="Clear all notifications"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Notification list */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-6 text-center text-[rgb(var(--color-text-secondary))]">
                  <Bell size={24} className="mb-2 opacity-40" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-[rgb(var(--color-border))]">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`relative p-3 ${
                        notification.read 
                          ? '' 
                          : 'bg-[rgba(var(--color-primary),0.05)]'
                      } hover:bg-[rgba(var(--color-primary),0.05)] transition-colors duration-100 group`}
                    >
                      <div className="flex gap-3">
                        {/* Notification icon/indicator */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getNotificationStyles(notification.type)}`}>
                          <span className="block w-2 h-2 rounded-full bg-current"></span>
                        </div>
                        
                        {/* Content */}
                        <div 
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => !notification.read && onMarkAsRead?.(notification.id)}
                        >
                          <p className="text-sm font-medium text-[rgb(var(--color-text))] line-clamp-2">
                            {notification.title}
                          </p>
                          {notification.message && (
                            <p className="mt-0.5 text-xs text-[rgb(var(--color-text-secondary))] line-clamp-2">
                              {notification.message}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-[rgb(var(--color-text-tertiary))]">
                            {notification.timestamp ? getRelativeTime(notification.timestamp) : 'Unknown time'}
                          </p>
                        </div>

                        {/* Remove button - always visible */}
                        <button
                          onClick={() => onRemoveNotification?.(notification.id)}
                          className="flex-shrink-0 p-1.5 hover:bg-[rgba(var(--color-primary),0.1)] rounded transition-all group"
                          aria-label="Remove notification"
                        >
                          <X size={14} className="text-[rgb(var(--color-text-secondary))] group-hover:text-[rgb(var(--color-primary))] transition-colors duration-200" />
                        </button>
                      </div>
                      
                      {/* Unread indicator */}
                      {!notification.read && (
                        <span className="absolute right-8 top-3 w-2 h-2 rounded-full bg-[rgb(var(--color-primary))]"></span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
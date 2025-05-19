import React, { useState, useEffect, useCallback } from 'react';
import { X, AlertCircle, InfoIcon, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationProps {
  id: string;
  title: string;
  message?: string;
  type: NotificationType;
  duration?: number;
  onClose: (id: string) => void;
}

export const Notification: React.FC<NotificationProps> = ({
  id,
  title,
  message,
  type = 'info',
  duration = 3500, // Reduced default duration from 5000ms to 3500ms for quicker notifications
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Memoize handleClose to prevent it from causing effect reruns
  const handleClose = useCallback(() => {
    setIsVisible(false);
    // Delay actual removal to allow for animation to complete
    setTimeout(() => onClose(id), 200); // Reduced from 300ms to 200ms for quicker exit
  }, [id, onClose]);

  // Setup auto-dismiss timer
  useEffect(() => {
    if (duration === 0) return; // Never auto-dismiss if duration is 0
    
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const setupTimeout = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (!isPaused) {
        timeoutId = setTimeout(handleClose, duration);
      }
    };
    
    // Initial setup
    setupTimeout();
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [duration, isPaused, handleClose]);
  
  // Get icon and color based on notification type
  const getNotificationProps = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircle size={24} />,
          iconColor: 'text-success-light dark:text-success'
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={24} />,
          iconColor: 'text-warning-light dark:text-warning'
        };
      case 'error':
        return {
          icon: <AlertCircle size={24} />,
          iconColor: 'text-error-light dark:text-error'
        };
      case 'info':
      default:
        return {
          icon: <InfoIcon size={24} />,
          iconColor: 'text-[rgb(var(--color-primary))]'
        };
    }
  };
  
  const { icon, iconColor } = getNotificationProps();
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: isVisible ? 1 : 0, x: isVisible ? 0 : 50 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="max-w-md w-full pointer-events-auto overflow-hidden rounded-md bg-[rgb(var(--color-card))] shadow-lg relative"
      role="alert"
      aria-live="assertive"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="p-5">
        <div className="flex items-start">
          {/* Icon */}
          <div className={`flex-shrink-0 mr-4 ${iconColor}`}>
            {icon}
          </div>
          
          {/* Content */}
          <div className="flex-1 pt-0.5">
            <p className="text-base font-medium text-[rgb(var(--color-text))]">{title}</p>
            {message && (
              <p className="mt-1.5 text-sm text-[rgb(var(--color-text-secondary))]">{message}</p>
            )}
          </div>
          
          {/* Close button */}
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="p-1 inline-flex rounded-md text-[rgb(var(--color-text-secondary))] hover:bg-[rgba(var(--color-primary),0.1)] hover:text-[rgb(var(--color-primary))] transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-primary))] focus-visible:ring-offset-2"
              onClick={handleClose}
              aria-label="Close notification"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Progress bar - positioned absolutely at the bottom with custom thin height */}
      {duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 w-full bg-[rgb(var(--color-progress-bg))] dark:bg-[rgb(var(--color-progress-bg-dark))]" style={{ height: '2px' }}>
          <motion.div 
            className="h-full bg-[rgb(var(--color-primary))]"
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{
              duration: duration / 1000, // Convert ms to seconds
              ease: "linear",
              onComplete: () => {
                if (!isPaused) {
                  handleClose();
                }
              }
            }}
          />
        </div>
      )}
    </motion.div>
  );
}
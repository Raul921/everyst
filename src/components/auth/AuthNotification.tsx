import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

type NotificationType = 'error' | 'success' | 'info' | 'warning';

interface AuthNotificationProps {
  type: NotificationType;
  message: string;
  onDismiss?: () => void;
}

export const AuthNotification: React.FC<AuthNotificationProps> = ({ type, message, onDismiss }) => {
  const getStyles = () => {
    switch (type) {
      case 'error':
        return {
          bg: 'bg-[rgba(var(--color-error),0.1)]',
          border: 'border-[rgb(var(--color-error))]',
          icon: <AlertCircle className="text-[rgb(var(--color-error))] flex-shrink-0 mr-2" size={18} />
        };
      case 'success':
        return {
          bg: 'bg-[rgba(var(--color-success),0.1)]',
          border: 'border-[rgb(var(--color-success))]',
          icon: <CheckCircle className="text-[rgb(var(--color-success))] flex-shrink-0 mr-2" size={18} />
        };
      case 'warning':
        return {
          bg: 'bg-[rgba(var(--color-warning),0.1)]',
          border: 'border-[rgb(var(--color-warning))]',
          icon: <AlertTriangle className="text-[rgb(var(--color-warning))] flex-shrink-0 mr-2" size={18} />
        };
      case 'info':
      default:
        return {
          bg: 'bg-[rgba(var(--color-info),0.1)]',
          border: 'border-[rgb(var(--color-info))]',
          icon: <Info className="text-[rgb(var(--color-info))] flex-shrink-0 mr-2" size={18} />
        };
    }
  };

  const styles = getStyles();

  return (
    <div className={`${styles.bg} border-l-4 ${styles.border} rounded-md p-4 mb-5 shadow-md flex items-start justify-between animate-fadeIn backdrop-blur-sm`}>
      <div className="flex items-start">
        {styles.icon}
        <span className="text-[rgb(var(--color-text))]">{message}</span>
      </div>
      {onDismiss && (
        <button 
          onClick={onDismiss} 
          className="ml-4 p-1 hover:bg-[rgba(var(--color-text),0.1)] rounded-full transition-colors"
          aria-label="Dismiss"
        >
          <X size={16} className="text-[rgb(var(--color-text-secondary))]" />
        </button>
      )}
    </div>
  );
};

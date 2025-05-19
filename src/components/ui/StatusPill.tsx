import React from 'react';

export type StatusType = 'success' | 'warning' | 'error' | 'neutral';

export interface StatusPillProps {
  status: StatusType;
  text?: string;
  className?: string;
  showDot?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  text,
  className = '',
  showDot = true,
  size = 'md',
}) => {
  // Default text based on status if none provided
  const defaultText = {
    success: 'Healthy',
    warning: 'Warning',
    error: 'Critical',
    neutral: 'Neutral',
  };

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  return (
    <span
      className={`status-pill status-pill-${status} inline-flex items-center ${sizeClasses[size]} ${className}`}
      role="status"
    >
      {showDot && (
        <span
          className={`mr-1.5 h-2 w-2 rounded-full ${
            status === 'success'
              ? 'bg-success-light dark:bg-success'
              : status === 'warning'
              ? 'bg-warning-light dark:bg-warning'
              : status === 'error'
              ? 'bg-error-light dark:bg-error'
              : 'bg-gray-500'
          }`}
          aria-hidden="true"
        />
      )}
      {text || defaultText[status]}
    </span>
  );
};
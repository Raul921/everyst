import React from 'react';

export type IconButtonVariant = 'default' | 'primary' | 'secondary' | 'ghost' | 'outline';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  label?: string;
  tooltipText?: string;
  tooltipPosition?: 'top' | 'right' | 'bottom' | 'left';
  active?: boolean;
  isLoading?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = 'default',
  size = 'md',
  label,
  tooltipText,
  tooltipPosition = 'top',
  active = false,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  // Base classes for all variants
  const baseClasses = 'inline-flex items-center justify-center rounded-md transition-colors duration-250 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-primary))] focus-visible:ring-offset-2';
  
  // Size classes
  const sizeClasses = {
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2',
  };

  // Icon size based on button size
  const iconSize = {
    sm: 12,
    md: 14,
    lg: 16,
  };
  
  // Variant classes - improved for better visibility across themes
  const variantClasses = {
    default: 'bg-white dark:bg-card-dark text-[rgb(var(--color-text))] hover:bg-[rgba(var(--color-primary),0.05)] hover:text-[rgb(var(--color-primary))] dark:hover:bg-[rgba(var(--color-primary),0.1)] dark:hover:text-[rgb(var(--color-primary))] border border-border-light dark:border-border-dark',
    primary: 'bg-[rgb(var(--color-primary))] text-white hover:bg-[rgb(var(--color-primary-light))]',
    secondary: 'bg-secondary text-white hover:bg-secondary/90 dark:hover:bg-secondary/80',
    ghost: 'text-[rgb(var(--color-text))] bg-transparent hover:bg-[rgba(var(--color-primary),0.05)] hover:text-[rgb(var(--color-primary))] dark:hover:bg-[rgba(var(--color-primary),0.1)] dark:hover:text-[rgb(var(--color-primary))]',
    outline: 'bg-transparent text-[rgb(var(--color-text))] border border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))] dark:hover:border-[rgb(var(--color-primary))] dark:hover:text-[rgb(var(--color-primary))]',
  };
  
  // Active state classes
  const activeClasses = active ? 'bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))]' : '';
  
  return (
    <button
      type="button"
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${activeClasses} ${className}`}
      disabled={disabled || isLoading}
      aria-label={label || tooltipText}
      data-tooltip={tooltipText}
      data-tooltip-position={tooltipPosition}
      {...props}
    >
      {isLoading ? (
        <span className="animate-spin">
          <svg className="h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      ) : (
        <span className="flex items-center justify-center">
          {React.isValidElement(icon) && React.cloneElement(icon, { ...(icon.props && typeof icon.props === 'object' && 'size' in icon.props ? { size: iconSize[size] } : {}) })}
        </span>
      )}
    </button>
  );
};
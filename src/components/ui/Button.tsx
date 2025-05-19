import React from 'react';

export type ButtonVariant = 'default' | 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button text content */
  children: React.ReactNode;
  
  /** Optional icon to display before the button text */
  leftIcon?: React.ReactNode;
  
  /** Optional icon to display after the button text */
  rightIcon?: React.ReactNode;
  
  /** Button style variant */
  variant?: ButtonVariant;
  
  /** Button size */
  size?: ButtonSize;
  
  /** Full width button */
  fullWidth?: boolean;
  
  /** Loading state */
  isLoading?: boolean;
  
  /** Active/selected state */
  active?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  leftIcon,
  rightIcon,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  active = false,
  className = '',
  disabled,
  ...props
}) => {
  // Base classes for all buttons
  const baseClasses = 'inline-flex items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-primary))] focus-visible:ring-offset-2';
  
  // Size classes
  const sizeClasses = {
    xs: 'px-2.5 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };
  
  // Variant classes
  const variantClasses = {
    default: 'bg-white dark:bg-card-dark text-[rgb(var(--color-text))] hover:bg-[rgba(var(--color-primary),0.05)] hover:text-[rgb(var(--color-primary))] dark:hover:bg-[rgba(var(--color-primary),0.1)] dark:hover:text-[rgb(var(--color-primary))] border border-border-light dark:border-border-dark',
    primary: 'bg-[rgb(var(--color-primary))] text-[rgb(var(--color-button-text))] hover:bg-[rgb(var(--color-primary-light))]',
    secondary: 'bg-[rgb(var(--color-secondary))] text-white hover:bg-[rgb(var(--color-secondary-light))]',
    danger: 'bg-[rgb(var(--color-error))] text-white hover:bg-[rgb(var(--color-error-light))]',
    ghost: 'text-[rgb(var(--color-text))] bg-transparent hover:bg-[rgba(var(--color-primary),0.05)] hover:text-[rgb(var(--color-primary))] dark:hover:bg-[rgba(var(--color-primary),0.1)] dark:hover:text-[rgb(var(--color-primary))]',
    outline: 'bg-transparent text-[rgb(var(--color-text))] border border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary))] dark:hover:border-[rgb(var(--color-primary))] dark:hover:text-[rgb(var(--color-primary))]',
  };
  
  // Width class
  const widthClass = fullWidth ? 'w-full' : '';
  
  // Active state classes
  const activeClasses = active ? 'bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))]' : '';
  
  // Disabled state
  const disabledClasses = (disabled || isLoading) ? 'opacity-50 cursor-not-allowed' : '';
  
  return (
    <button
      type="button"
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${activeClasses} ${disabledClasses} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="animate-spin mr-2">
          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      )}
      
      {!isLoading && leftIcon && (
        <span className="mr-2 inline-flex">
          {leftIcon}
        </span>
      )}
      
      <span>{children}</span>
      
      {rightIcon && (
        <span className="ml-2 inline-flex">
          {rightIcon}
        </span>
      )}
    </button>
  );
};

export default Button;

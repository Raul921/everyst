import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  isLoading?: boolean;
  error?: string | null;
  onCollapse?: (isCollapsed: boolean) => void;
  footerContent?: React.ReactNode;
  frostLevel?: 'light' | 'medium' | 'heavy' | 'none';
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  className = '',
  collapsible = false,
  defaultCollapsed = false,
  isLoading = false,
  error = null,
  onCollapse,
  footerContent,
  frostLevel = 'frost',
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const { colorScheme } = useTheme();
  
  const handleToggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    if (onCollapse) {
      onCollapse(newCollapsedState);
    }
  };

  // Apply different transparency and overlay based on the theme
  const cardClass = frostLevel === 'none'
    ? 'bg-[rgb(var(--color-card))] border-[rgb(var(--color-border))]'
    : colorScheme === 'dark'
      // Dark mode: more transparent, subtle frost effect
      ? 'bg-[rgba(var(--color-card),0.65)] backdrop-blur-[2.5px] before:absolute before:inset-0 before:bg-white/[0.08] before:pointer-events-none shadow-sm'
      // Light mode: more opaque with subtle frost effect
      : 'bg-[rgba(var(--color-card),0.85)] backdrop-blur-[2.5px] before:absolute before:inset-0 before:bg-black/[0.02] before:pointer-events-none shadow-sm';

  return (
    <div className={`card relative transition-all duration-250 text-[rgb(var(--color-text))] overflow-hidden ${cardClass} ${className}`}>
      {/* Card header */}
      {title && (
        <div className="flex justify-between items-center mb-3 relative z-10">
          <h3 className="font-medium text-base">{title}</h3>
          {collapsible && (
            <button 
              onClick={handleToggleCollapse} 
              className="p-1 hover:bg-[rgba(var(--color-primary),0.1)] hover:text-[rgb(var(--color-primary))] dark:hover:text-[rgb(var(--color-primary))] rounded-full transition-colors duration-200"
              aria-expanded={!isCollapsed}
              aria-label={isCollapsed ? "Expand card" : "Collapse card"}
            >
              {isCollapsed ? (
                <ChevronDown size={18} />
              ) : (
                <ChevronUp size={18} />
              )}
            </button>
          )}
        </div>
      )}

      {/* Card content */}
      <div 
        className={`transition-all duration-300 relative z-10 ${
          isCollapsed ? 'h-0 overflow-hidden opacity-0' : 'opacity-100'
        }`}
      >
        {/* Loading state */}
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[rgb(var(--color-primary))]"></div>
          </div>
        ) : error ? (
          // Error state
          <div className="bg-error/10 text-error-light dark:text-error p-3 rounded-md">
            {error}
          </div>
        ) : (
          // Default content
          children
        )}
      </div>

      {/* Card footer */}
      {footerContent && !isCollapsed && (
        <div className="mt-3 pt-3 border-t border-[rgb(var(--color-border))] relative z-10">
          {footerContent}
        </div>
      )}
    </div>
  );
};

// Empty state wrapper for Card
export const CardEmptyState: React.FC<{
  message: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}> = ({ message, icon, action }) => {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      {icon && <div className="mb-3 text-[rgb(var(--color-text-secondary))]">{icon}</div>}
      <p className="text-[rgb(var(--color-text-secondary))] mb-4">{message}</p>
      {action}
    </div>
  );
};
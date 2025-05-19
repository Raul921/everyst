import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ToolCardProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  badge?: {
    text: string;
    color: 'primary' | 'success' | 'warning' | 'error' | 'info';
  };
  className?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean; // Added defaultExpanded prop
}

export const ToolCard: React.FC<ToolCardProps> = ({
  title,
  description,
  icon,
  badge,
  className = '',
  children,
  defaultExpanded = true // Default to expanded
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  
  const badgeColors = {
    primary: 'bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-primary))]',
    success: 'bg-[rgba(var(--color-success),0.1)] text-[rgb(var(--color-success))]',
    warning: 'bg-[rgba(var(--color-warning),0.1)] text-[rgb(var(--color-warning))]',
    error: 'bg-[rgba(var(--color-error),0.1)] text-[rgb(var(--color-error))]',
    info: 'bg-[rgba(var(--color-text-secondary),0.1)] text-[rgb(var(--color-text-secondary))]',
  };

  return (
    <div 
      className={`bg-[rgb(var(--color-card))] border border-[rgb(var(--color-border))] rounded-lg shadow-sm overflow-hidden ${className}`}
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-[rgba(var(--color-primary),0.1)] flex items-center justify-center text-[rgb(var(--color-primary))]">
              {icon}
            </div>
            <div>
              <h3 className="font-medium text-[rgb(var(--color-text))] flex items-center">
                {title}
                {badge && (
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${badgeColors[badge.color]}`}>
                    {badge.text}
                  </span>
                )}
              </h3>
              {description && (
                <p className="text-sm text-[rgb(var(--color-text-secondary))]">{description}</p>
              )}
            </div>
          </div>
          
          {/* Toggle expand/collapse button */}
          <button 
            onClick={() => setIsExpanded(!isExpanded)} 
            className="p-1 hover:bg-[rgba(var(--color-primary),0.1)] text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-primary))] rounded-full transition-colors"
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </button>
        </div>
      </div>
      
      {/* Content section - conditionally rendered based on expanded state */}
      {isExpanded && (
        <div className="px-4 py-3 border-t border-[rgb(var(--color-border))]">
          {children}
        </div>
      )}
    </div>
  );
};
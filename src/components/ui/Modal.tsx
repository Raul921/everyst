import React from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footerContent?: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  footerContent 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-[rgb(var(--color-card))] rounded-lg shadow-xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          animation: 'modalFadeIn 200ms ease-out',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[rgb(var(--color-border))] p-4">
          <h2 className="text-xl font-semibold text-[rgb(var(--color-text))]">{title}</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-md hover:bg-[rgba(var(--color-primary),0.1)] transition-colors group"
          >
            <X size={20} className="text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary))] transition-colors" />
          </button>
        </div>
        
        {/* Modal Content */}
        <div className="p-6">
          {children}
        </div>
        
        {/* Modal Footer */}
        {footerContent && (
          <div className="border-t border-[rgb(var(--color-border))] p-4">
            {footerContent}
          </div>
        )}
      </div>
    </div>
  );
};

// Add animation to global CSS in index.css
// @keyframes modalFadeIn {
//   from { opacity: 0; transform: scale(0.95); }
//   to { opacity: 1; transform: scale(1); }
// }

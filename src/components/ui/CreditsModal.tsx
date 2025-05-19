import React from 'react';
import { X } from 'lucide-react';

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  logoDesigner: {
    name: string;
    url?: string;
  };
}

export const CreditsModal: React.FC<CreditsModalProps> = ({ isOpen, onClose, logoDesigner }) => {
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
        <div className="flex items-center justify-between border-b border-[rgb(var(--color-border))] p-4">
          <h2 className="text-xl font-semibold text-[rgb(var(--color-text))]">Credits</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-md hover:bg-[rgba(var(--color-primary),0.1)] transition-colors group"
          >
            <X size={20} className="text-[rgb(var(--color-text))] group-hover:text-[rgb(var(--color-primary))] transition-colors" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-[rgb(var(--color-text))] mb-2">Logo Design</h3>
            <p className="text-[rgb(var(--color-text-secondary))]">
              The everyst logo was designed by{' '}
              {logoDesigner.url ? (
                <a 
                  href={logoDesigner.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-light))] transition-colors"
                  style={{
                    textDecoration: 'underline',
                    textUnderlineOffset: '2px'
                  }}
                >
                  {logoDesigner.name}
                </a>
              ) : (
                <span className="text-[rgb(var(--color-text))]">{logoDesigner.name}</span>
              )}. 
              We appreciate their contribution to making everyst look great!
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-[rgb(var(--color-text))] mb-2">Project Information</h3>
            <p className="text-[rgb(var(--color-text-secondary))] mb-3">
              everyst is an open-source project developed by Jordon Harrison.
            </p>
            <p className="text-[rgb(var(--color-text-secondary))]">
              Visit the{' '}
              <a 
                href="https://github.com/Jordonh18/everyst" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[rgb(var(--color-primary))] hover:text-[rgb(var(--color-primary-light))] transition-colors"
                style={{
                  textDecoration: 'underline',
                  textUnderlineOffset: '2px'
                }}
              >
                GitHub repository
              </a>{' '}
              to learn more about the project, contribute, or report issues.
            </p>
          </div>
        </div>
        
        <div className="border-t border-[rgb(var(--color-border))] p-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[rgb(var(--color-primary))] text-[rgb(var(--color-button-text))] hover:bg-[rgb(var(--color-primary-light))] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Add animation to global CSS in index.css
// @keyframes modalFadeIn {
//   from { opacity: 0; transform: scale(0.95); }
//   to { opacity: 1; transform: scale(1); }
// }

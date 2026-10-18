import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'lg',
  className,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass =
    {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      '3xl': 'max-w-3xl',
      '4xl': 'max-w-4xl',
      '5xl': 'max-w-5xl',
    }[maxWidth] || 'max-w-lg';

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-6 flex min-h-full items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        className={cn(
          'relative w-full my-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl dark:shadow-[0_25px_60px_rgba(0,0,0,0.85)] border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] z-10 text-slate-900 dark:text-slate-100 transform transition-all',
          maxWidthClass,
          className
        )}
      >
        {/* Stationary Modal Header */}
        <div className="flex items-start justify-between px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/60 dark:bg-slate-900/80 rounded-t-2xl">
          <div className="pr-4">
            <h3 id="modal-title" className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {title}
            </h3>
            {description && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 -mr-1"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="overflow-y-auto p-6 flex-1 overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
};

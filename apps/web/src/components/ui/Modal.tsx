import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl';
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
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
      '6xl': 'max-w-6xl',
    }[maxWidth] || 'max-w-lg';

  const modalElement = (
    <div
      className="fixed inset-0 z-50 overflow-y-auto p-2 sm:p-4 md:p-6 flex min-h-[100dvh] items-center justify-center overscroll-contain"
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

      {/* Modal Dialog with m-auto to prevent flexbox negative scroll clipping */}
      <div
        className={cn(
          'relative w-full m-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl dark:shadow-[0_25px_60px_rgba(0,0,0,0.85)] border border-slate-200 dark:border-slate-800 flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2.5rem)] md:max-h-[calc(100dvh-3rem)] z-10 text-slate-900 dark:text-slate-100 transform transition-all',
          maxWidthClass,
          className
        )}
      >
        {/* Stationary Modal Header */}
        <div className="flex items-start justify-between px-5 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/70 dark:bg-slate-900/80 rounded-t-2xl">
          <div className="pr-4 min-w-0">
            <h3 id="modal-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug truncate">
              {title}
            </h3>
            {description && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{description}</p>
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
        <div className="overflow-y-auto min-h-0 flex-1 p-4 sm:p-6 overscroll-contain">
          {children}
        </div>

        {/* Stationary Pinned Modal Footer */}
        {footer && (
          <div className="px-5 sm:px-6 py-3 sm:py-3.5 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/80 dark:bg-slate-900/90 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalElement, document.body)
    : modalElement;
};

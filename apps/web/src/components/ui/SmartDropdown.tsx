import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface SmartDropdownProps {
  trigger: (props: {
    isOpen: boolean;
    toggle: () => void;
    ref: React.RefObject<HTMLButtonElement>;
  }) => React.ReactNode;
  children: (props: { close: () => void }) => React.ReactNode;
  align?: 'left' | 'right' | 'auto';
  className?: string;
  minWidth?: number;
  maxDropdownHeight?: number;
  portal?: boolean;
}

export const SmartDropdown: React.FC<SmartDropdownProps> = ({
  trigger,
  children,
  align = 'auto',
  className,
  minWidth = 240,
  maxDropdownHeight = 420,
  portal = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');
  const [menuStyles, setMenuStyles] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Available vertical space
    const spaceBelow = viewportHeight - triggerRect.bottom;
    const spaceAbove = triggerRect.top;

    const ESTIMATED_HEIGHT = 280;
    const shouldOpenAbove = spaceBelow < ESTIMATED_HEIGHT && spaceAbove > spaceBelow;

    const actualPlacement = shouldOpenAbove ? 'top' : 'bottom';
    setPlacement(actualPlacement);

    const availableVerticalSpace = shouldOpenAbove
      ? Math.max(160, spaceAbove - 16)
      : Math.max(160, spaceBelow - 16);

    const effectiveMaxHeight = Math.min(maxDropdownHeight, availableVerticalSpace);

    if (portal) {
      // Fixed positioning relative to viewport
      const style: React.CSSProperties = {
        position: 'fixed',
        zIndex: 9999,
        maxHeight: `${effectiveMaxHeight}px`,
        overflowY: 'auto',
      };

      if (shouldOpenAbove) {
        style.bottom = `${viewportHeight - triggerRect.top + 6}px`;
      } else {
        style.top = `${triggerRect.bottom + 6}px`;
      }

      // Horizontal alignment
      const preferRight = align === 'right' || (align === 'auto' && triggerRect.left > viewportWidth / 2);

      if (preferRight) {
        const rightPos = Math.max(12, viewportWidth - triggerRect.right);
        style.right = `${rightPos}px`;
        style.maxWidth = `${Math.min(viewportWidth - 24, 380)}px`;
      } else {
        const leftPos = Math.max(12, triggerRect.left);
        style.left = `${leftPos}px`;
        style.maxWidth = `${Math.min(viewportWidth - leftPos - 12, 380)}px`;
      }

      setMenuStyles(style);
    } else {
      // Relative positioning inside trigger parent
      const style: React.CSSProperties = {
        position: 'absolute',
        zIndex: 50,
        maxHeight: `${effectiveMaxHeight}px`,
        overflowY: 'auto',
      };

      if (shouldOpenAbove) {
        style.bottom = 'calc(100% + 6px)';
      } else {
        style.top = 'calc(100% + 6px)';
      }

      const preferRight = align === 'right' || (align === 'auto' && triggerRect.left > viewportWidth / 2);
      if (preferRight) {
        style.right = 0;
      } else {
        style.left = 0;
      }

      setMenuStyles(style);
    }
  }, [align, maxDropdownHeight, portal]);

  // Recalculate on open, resize, or scroll
  useEffect(() => {
    if (!isOpen) return;

    calculatePosition();

    const handleScrollOrResize = () => {
      calculatePosition();
    };

    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    window.addEventListener('scroll', handleScrollOrResize, { passive: true, capture: true });

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, { capture: true });
    };
  }, [isOpen, calculatePosition]);

  // Outside click and ESC handler
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggle = () => {
    setIsOpen((prev) => !prev);
  };

  const close = () => {
    setIsOpen(false);
  };

  const menuContent = isOpen ? (
    <div
      ref={menuRef}
      style={menuStyles}
      className={cn(
        'rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overscroll-contain transition-all duration-150',
        placement === 'top'
          ? 'animate-in fade-in slide-in-from-bottom-2'
          : 'animate-in fade-in slide-in-from-top-2',
        className
      )}
      role="menu"
    >
      {children({ close })}
    </div>
  ) : null;

  return (
    <div className="relative inline-block">
      {trigger({ isOpen, toggle, ref: triggerRef })}
      {portal && typeof document !== 'undefined'
        ? createPortal(menuContent, document.body)
        : menuContent}
    </div>
  );
};

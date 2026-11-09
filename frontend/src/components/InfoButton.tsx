import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Info, X } from 'lucide-react';

interface InfoButtonProps {
  title?: string;
  content: React.ReactNode;
  label?: string;
  className?: string;
  align?: 'left' | 'right' | 'center';
}

export const InfoButton: React.FC<InfoButtonProps> = ({
  title,
  content,
  label,
  className = '',
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; isAbove: boolean }>({
    top: 0,
    left: 0,
    width: 320,
    isAbove: false,
  });
  const [isMobileView, setIsMobileView] = useState(false);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const closeTimeout = useRef<any>(null);

  // Position calculation relative to viewport
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const isMobile = window.innerWidth < 640;
    setIsMobileView(isMobile);

    if (isMobile) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const width = Math.min(340, window.innerWidth - 32);

    let left = rect.left;
    if (align === 'right') {
      left = rect.right - width;
    } else if (align === 'center') {
      left = rect.left + rect.width / 2 - width / 2;
    } else {
      left = rect.left;
    }

    // Safety boundary clamping so popover never leaves the viewport
    const minLeft = 16;
    const maxLeft = window.innerWidth - width - 16;
    left = Math.max(minLeft, Math.min(left, maxLeft));

    // Vertical positioning (below or above)
    let isAbove = false;
    let top = rect.bottom + 8;
    if (rect.bottom + 240 > window.innerHeight && rect.top > 240) {
      top = rect.top - 8;
      isAbove = true;
    }

    setCoords({ top, left, width, isAbove });
  }, [align]);

  // Update position when opened or on scroll / resize
  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScrollOrResize = () => updatePosition();
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
      return () => {
        window.removeEventListener('scroll', handleScrollOrResize, true);
        window.removeEventListener('resize', handleScrollOrResize);
      };
    }
  }, [isOpen, updatePosition]);

  // Outside click / tap to close
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current &&
        !buttonRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick, { passive: true });
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Desktop Hover handlers with grace timeout
  const handleMouseEnter = () => {
    if (closeTimeout.current) clearTimeout(closeTimeout.current);
    updatePosition();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimeout.current = setTimeout(() => {
      setIsOpen(false);
    }, 250);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const popoverContent = (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileView && (
        <div
          className="fixed inset-0 z-99998 bg-black/25 backdrop-blur-2xs animate-in fade-in duration-150"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
        />
      )}

      {/* Popover Card */}
      <div
        ref={popoverRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => e.stopPropagation()}
        style={
          isMobileView
            ? undefined
            : {
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                width: `${coords.width}px`,
              }
        }
        className={
          isMobileView
            ? 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-99999 w-[88vw] max-w-sm p-4 bg-white text-stone-800 rounded-2xl shadow-2xl border border-stone-200 text-xs leading-relaxed animate-in fade-in zoom-in-95 duration-150'
            : `fixed z-99999 p-4 bg-white text-stone-800 rounded-2xl shadow-xl border border-stone-200 text-xs leading-relaxed transition-all animate-in fade-in duration-150 ${
                coords.isAbove ? '-translate-y-full' : ''
              }`
        }
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-stone-100">
          <span className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{title || 'Information & Guidance'}</span>
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-md hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="text-stone-600 space-y-1.5 text-[11px] leading-relaxed">
          {content}
        </div>
      </div>
    </>
  );

  return (
    <div className={`inline-flex items-center ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label={title || 'Information & Instructions'}
        className="inline-flex items-center gap-1 text-stone-500 hover:text-stone-900 p-1 rounded-full hover:bg-stone-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 cursor-pointer"
      >
        <span className="w-4 h-4 rounded-full border border-stone-300 flex items-center justify-center text-[10px] font-serif font-bold text-stone-700 bg-stone-50 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-800 transition-colors">
          i
        </span>
        {label && <span className="text-xs font-medium text-stone-600">{label}</span>}
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(popoverContent, document.body)}
    </div>
  );
};

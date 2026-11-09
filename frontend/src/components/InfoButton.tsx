import React, { useState, useRef, useEffect } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimeout = useRef<any>(null);

  // Close on outside click / tap
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick, { passive: true });
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  // Desktop hover handlers
  const handleMouseEnter = () => {
    if (window.innerWidth >= 768) {
      if (closeTimeout.current) clearTimeout(closeTimeout.current);
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (window.innerWidth >= 768) {
      closeTimeout.current = setTimeout(() => {
        setIsOpen(false);
      }, 150);
    }
  };

  const alignmentClasses = {
    left: 'left-0 sm:left-0',
    right: 'right-0 sm:right-0',
    center: 'left-1/2 -translate-x-1/2',
  }[align];

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        aria-label={title || 'Information & Instructions'}
        className="inline-flex items-center gap-1 text-stone-500 hover:text-stone-900 p-1 rounded-full hover:bg-stone-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-amber-500/40 cursor-pointer"
      >
        <span className="w-4 h-4 rounded-full border border-stone-300 flex items-center justify-center text-[10px] font-serif font-bold text-stone-700 bg-stone-50 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-800 transition-colors">
          i
        </span>
        {label && <span className="text-xs font-medium text-stone-600">{label}</span>}
      </button>

      {isOpen && (
        <>
          {/* Mobile backdrop to easily tap anywhere to dismiss */}
          <div
            className="fixed inset-0 z-40 bg-black/20 sm:hidden backdrop-blur-2xs"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          />

          {/* Tooltip / Modal popover */}
          <div
            className={`fixed sm:absolute top-1/2 sm:top-full left-1/2 sm:left-auto sm:mt-1.5 -translate-x-1/2 -translate-y-1/2 sm:translate-x-0 sm:translate-y-0 z-50 w-[88vw] sm:w-80 max-w-sm p-4 bg-white text-stone-800 rounded-2xl shadow-xl sm:shadow-lg border border-stone-200 text-xs leading-relaxed transition-all animate-in fade-in zoom-in-95 sm:zoom-in-100 duration-150 ${alignmentClasses}`}
            onClick={(e) => e.stopPropagation()}
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
                className="text-stone-400 hover:text-stone-700 p-1 rounded-md hover:bg-stone-100 transition-colors"
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
      )}
    </div>
  );
};

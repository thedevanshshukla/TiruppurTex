import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon } from 'lucide-react';

interface StatusBadgeProps {
  status: 'GREEN' | 'AMBER' | 'RED' | string;
  delayDays?: number;
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  delayDays = 0,
  showIcon = true,
  className = '',
}) => {
  const normalized = (status || 'GREEN').toUpperCase();

  if (normalized === 'GREEN') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ecfdf5] text-[#166534] border border-[#bbf7d0] ${className}`}>
        {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-[#15803d]" />}
        <span>On Track</span>
      </span>
    );
  }

  if (normalized === 'AMBER') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fffbeb] text-[#92400e] border border-[#fde68a] ${className}`}>
        {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-[#b45309]" />}
        <span>Amber {delayDays > 0 ? `(+${delayDays}d)` : 'Warning'}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#fef2f2] text-[#991b1b] border border-[#fecaca] ${className}`}>
      {showIcon && <AlertOctagon className="w-3.5 h-3.5 text-[#b91c1c]" />}
      <span>Critical {delayDays > 0 ? `(+${delayDays}d delay)` : 'Red'}</span>
    </span>
  );
};

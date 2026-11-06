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
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 ${className}`}>
        {showIcon && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
        <span>On Track</span>
      </span>
    );
  }

  if (normalized === 'AMBER') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80 ${className}`}>
        {showIcon && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
        <span>Amber {delayDays > 0 ? `(+${delayDays}d)` : 'Warning'}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 ${className}`}>
      {showIcon && <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />}
      <span>Critical {delayDays > 0 ? `(+${delayDays}d delay)` : 'Red'}</span>
    </span>
  );
};


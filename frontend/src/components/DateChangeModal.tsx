import React, { useState } from 'react';
import { X, CalendarClock, ShieldAlert, Loader2 } from 'lucide-react';
import { apiClient } from '../api/client';

interface DateChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  poNumber: string;
  currentDate: string;
  onSuccess: () => void;
}

export const DateChangeModal: React.FC<DateChangeModalProps> = ({
  isOpen,
  onClose,
  orderId,
  poNumber,
  currentDate,
  onSuccess,
}) => {
  const [newDate, setNewDate] = useState(currentDate);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A compliance reason is mandatory for all date changes.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiClient.patch(`/orders/${orderId}/date`, {
        milestone_name: 'Ex-Factory Handover',
        field_changed: 'ex_factory_date',
        new_date: newDate,
        reason: reason.trim(),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update date');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in duration-200">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight">Compliance Date Revision</h3>
              <p className="text-xs text-slate-400">PO: {poNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              All date changes are permanently recorded in the immutable audit log for buyer compliance audits.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Current Contractual Ex-Factory Date
            </label>
            <input
              type="text"
              readOnly
              value={currentDate}
              className="w-full px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-mono border border-slate-200 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Ex-Factory Date *
            </label>
            <input
              type="date"
              required
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full px-3 py-2 bg-white text-slate-900 rounded-lg text-xs border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mandatory Compliance Reason *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Buyer sourcing team granted 3-day extension due to yarn dyeing lot re-test."
              className="w-full px-3 py-2 bg-white text-slate-900 rounded-lg text-xs border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed"
            />
          </div>

          {error && (
            <div className="text-xs text-rose-600 font-medium">{error}</div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Confirm & Record in Audit Log</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


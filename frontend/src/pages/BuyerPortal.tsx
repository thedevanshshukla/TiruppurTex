import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { InfoButton } from '../components/InfoButton';
import { 
  ShieldCheck, 
  Lock, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Image as ImageIcon, 
  AlertCircle, 
  FileSpreadsheet, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface BuyerPortalProps {
  onNavigateExport: () => void;
}

export const BuyerPortal: React.FC<BuyerPortalProps> = ({ onNavigateExport }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBuyerOrders = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/buyer/orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to load buyer orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuyerOrders();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">Buyer Sourcing Portal</h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              Verified Factory View
            </span>
            <InfoButton
              align="left"
              title="Multi-Tenant Data Security"
              content={
                <div className="space-y-1.5 text-stone-600">
                  <p><strong>Tenant Isolation Enforced:</strong> Production data is strictly isolated to your buyer account (<code>{user?.buyer_id || user?.email}</code>).</p>
                  <p><strong>Read-Only Access:</strong> You receive verified milestone updates, floor output counts, and approved delay notices without exposure to other clients' data.</p>
                </div>
              }
            />
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Production milestone tracking & QC verification for <strong className="text-stone-700">{user?.name}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchBuyerOrders}
            className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl border border-stone-200 transition-colors"
            title="Refresh orders"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onNavigateExport}
            className="px-3.5 py-2 bg-[#1e2633] hover:bg-[#2c3749] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export Weekly Report</span>
          </button>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-600 mb-2" />
          <p className="text-xs font-semibold text-stone-600">Loading your export production lots...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center space-y-2">
          <ShieldCheck className="w-8 h-8 text-stone-400 mx-auto" />
          <p className="text-sm font-bold text-stone-800">No active production orders found</p>
          <p className="text-xs text-stone-500">Contact your dedicated Company A merchandiser to link your POs.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map((o) => (
            <div
              key={o.order_id}
              className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden"
            >
              {/* Order Header Ribbon */}
              <div className="px-4 sm:px-6 py-3.5 bg-stone-50/70 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs sm:text-sm font-bold text-stone-900 bg-white px-2.5 py-0.5 rounded border border-stone-200">
                      {o.po_number}
                    </span>
                    <StatusBadge status={o.health_status} />
                  </div>
                  <h3 className="text-xs sm:text-sm font-bold text-stone-800">
                    {o.style_name} <span className="text-stone-500 font-normal">({o.color})</span>
                  </h3>
                </div>

                <div className="flex items-center gap-4 text-xs text-stone-600">
                  <div>
                    <div className="text-[10px] text-stone-400 uppercase font-semibold">Total Order</div>
                    <div className="font-bold text-stone-900 font-mono text-xs sm:text-sm">
                      {o.total_quantity.toLocaleString()} pcs
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-stone-400 uppercase font-semibold">Ex-Factory Date</div>
                    <div className="font-bold text-stone-900 font-mono text-xs sm:text-sm">{o.ex_factory_date}</div>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-6 space-y-5">
                {/* Production Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-medium text-stone-600">
                      Current Stage: <strong className="text-stone-900 font-bold">{o.current_stage}</strong>
                    </span>
                    <span className="font-mono font-bold text-stone-900">
                      {o.completed_quantity.toLocaleString()} pcs ({o.completion_percentage}%)
                    </span>
                  </div>

                  <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        o.health_status === 'RED' ? 'bg-rose-600' : o.health_status === 'AMBER' ? 'bg-amber-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${Math.min(100, o.completion_percentage)}%` }}
                    />
                  </div>
                </div>

                {/* Milestone Stepper */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-stone-600" />
                      <span>Milestone Progress Tracker</span>
                    </h4>
                    <span className="text-[10px] text-stone-400 sm:hidden">Swipe →</span>
                  </div>

                  <div className="flex sm:grid sm:grid-cols-7 gap-2 overflow-x-auto pb-1 text-xs">
                    {o.milestones.map((m: any, idx: number) => {
                      const isDone = m.status === 'COMPLETED';
                      const isCurrent = m.stage_name === o.current_stage;
                      return (
                        <div
                          key={m._id}
                          className={`min-w-[120px] sm:min-w-0 p-2.5 rounded-xl border text-center transition-colors shrink-0 sm:shrink ${
                            isDone
                              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                              : isCurrent
                              ? 'bg-amber-50/70 border-amber-300 text-amber-950 font-bold'
                              : 'bg-stone-50 border-stone-200 text-stone-500'
                          }`}
                        >
                          <div className="text-[10px] font-semibold text-stone-400">Step {idx + 1}</div>
                          <div className="font-semibold text-[11px] truncate mt-0.5" title={m.stage_name}>
                            {m.stage_name.replace(' / Embroidery', '').replace(' & Dyeing', '').replace(' & Ironing', '')}
                          </div>
                          <div className="mt-1">
                            {isDone ? (
                              <span className="text-[9px] font-bold uppercase text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                                Done
                              </span>
                            ) : isCurrent ? (
                              <span className="text-[9px] font-bold uppercase text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded animate-pulse">
                                Active
                              </span>
                            ) : (
                              <span className="text-[9px] text-stone-400">Pending</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Verified Floor Inspection Photos */}
                {o.verified_photos && o.verified_photos.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-stone-600" />
                      <span>Floor Inspection Visual Proof</span>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-0.5">
                      {o.verified_photos.map((p: any, i: number) => (
                        <div key={i} className="rounded-xl overflow-hidden border border-stone-200 shadow-2xs">
                          <img src={p.photo_url} alt="Floor Proof" className="w-full h-24 object-cover" />
                          <div className="p-1.5 bg-stone-50 text-[10px] text-stone-600 font-medium truncate">
                            {p.stage} ({p.date})
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confirmed Factory Notices */}
                {o.approved_notices && o.approved_notices.length > 0 && (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1">
                    <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Verified Factory Status Notice</span>
                    </div>
                    {o.approved_notices.map((n: any, idx: number) => (
                      <div key={idx} className="text-xs text-amber-800 leading-relaxed pl-5">
                        • <strong>{n.category}:</strong> {n.notice}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

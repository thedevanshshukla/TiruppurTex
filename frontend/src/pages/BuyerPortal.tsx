import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Buyer Sourcing Portal</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Read-Only Verified View
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time milestone tracking & factory verification for <strong className="text-slate-800">{user?.name}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchBuyerOrders}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onNavigateExport}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export Weekly Status Report</span>
          </button>
        </div>
      </div>

      {/* Strict Tenant Isolation Notice */}
      <div className="p-3.5 bg-slate-900 text-slate-300 rounded-2xl flex items-center justify-between text-xs border border-slate-800">
        <div className="flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Multi-Tenant Isolation Enforced:</strong> Data queries are strictly scoped to account <span className="font-mono text-white underline">{user?.buyer_id || user?.email}</span>. Cross-buyer volumes and styles are cryptographically isolated.
          </span>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
          <p className="text-xs font-semibold text-slate-600">Loading your export production lots...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800">No active production orders found</p>
          <p className="text-xs text-slate-500 mt-1">Contact your dedicated Company A merchandiser to link your POs.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((o) => (
            <div
              key={o.order_id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
            >
              {/* Order Header Ribbon */}
              <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-slate-900 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                      {o.po_number}
                    </span>
                    <StatusBadge status={o.health_status} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {o.style_name} <span className="text-slate-500 font-normal">({o.color})</span>
                  </h3>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Total Order</div>
                    <div className="font-extrabold text-slate-900 font-mono text-sm">
                      {o.total_quantity.toLocaleString()} pcs
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-bold">Ex-Factory Date</div>
                    <div className="font-bold text-slate-900 font-mono">{o.ex_factory_date}</div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Production Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline text-xs">
                    <span className="font-semibold text-slate-700">
                      Current Stage: <strong className="text-indigo-700">{o.current_stage}</strong>
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {o.completed_quantity.toLocaleString()} pcs completed ({o.completion_percentage}%)
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        o.health_status === 'RED' ? 'bg-rose-500' : o.health_status === 'AMBER' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, o.completion_percentage)}%` }}
                    />
                  </div>
                </div>

                {/* Milestone Stepper */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    Milestone Progress Tracker
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-xs pt-1">
                    {o.milestones.map((m: any, idx: number) => {
                      const isDone = m.status === 'COMPLETED';
                      const isCurrent = m.stage_name === o.current_stage;
                      return (
                        <div
                          key={m._id}
                          className={`p-2.5 rounded-xl border text-center transition-colors ${
                            isDone
                              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                              : isCurrent
                              ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-bold ring-2 ring-indigo-500/20'
                              : 'bg-slate-50 border-slate-200 text-slate-500'
                          }`}
                        >
                          <div className="text-[10px] font-bold text-slate-400">Step {idx + 1}</div>
                          <div className="font-semibold text-[11px] truncate mt-0.5" title={m.stage_name}>
                            {m.stage_name.replace(' / Embroidery', '').replace(' & Dyeing', '').replace(' & Ironing', '')}
                          </div>
                          <div className="mt-1">
                            {isDone ? (
                              <span className="text-[9px] font-bold uppercase text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                                Done
                              </span>
                            ) : isCurrent ? (
                              <span className="text-[9px] font-bold uppercase text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded animate-pulse">
                                In Progress
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-400">Pending</span>
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
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                      Factory Floor Visual Verification Proof
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      {o.verified_photos.map((p: any, i: number) => (
                        <div key={i} className="rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
                          <img src={p.photo_url} alt="Floor Proof" className="w-full h-24 object-cover" />
                          <div className="p-1.5 bg-slate-50 text-[10px] text-slate-600 font-medium truncate">
                            {p.stage} ({p.date})
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Confirmed Factory Notices (Only merchandiser approved notices are shown) */}
                {o.approved_notices && o.approved_notices.length > 0 && (
                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5">
                    <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span>Verified Factory Status Notice</span>
                    </div>
                    {o.approved_notices.map((n: any, idx: number) => (
                      <div key={idx} className="text-xs text-amber-800 leading-relaxed">
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


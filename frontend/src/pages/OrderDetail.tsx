import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { RunRateMathModal } from '../components/RunRateMathModal';
import { DateChangeModal } from '../components/DateChangeModal';
import { 
  ArrowLeft, 
  Calendar, 
  Calculator, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  History, 
  FileText, 
  Building2, 
  ShieldCheck,
  RefreshCw,
  TrendingUp,
  Image as ImageIcon
} from 'lucide-react';

interface OrderDetailProps {
  orderId: string;
  onBack: () => void;
}

export const OrderDetail: React.FC<OrderDetailProps> = ({ orderId, onBack }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mathModalOpen, setMathModalOpen] = useState(false);
  const [dateModalOpen, setDateModalOpen] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/orders/${orderId}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load order detail', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [orderId]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-3" />
        <p className="text-xs font-semibold text-slate-600">Loading order details and compliance logs...</p>
      </div>
    );
  }

  if (!data || !data.order) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <p className="text-sm font-bold text-slate-800">Order not found</p>
        <button onClick={onBack} className="mt-3 text-xs text-indigo-600 font-bold">
          Back to Order Board
        </button>
      </div>
    );
  }

  const { order, milestones, daily_logs, issues, audit_logs, run_rate_projection } = data;
  const progressPct = Math.round((order.completed_quantity / order.total_quantity) * 100);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xl font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                {order.po_number}
              </span>
              <StatusBadge
                status={order.health_status}
                delayDays={run_rate_projection?.projected_delay_days || 0}
              />
            </div>
            <h1 className="text-sm font-bold text-slate-800 mt-1">{order.style_name} ({order.color})</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMathModalOpen(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Calculator className="w-4 h-4 text-indigo-600" />
            <span>Run-Rate Math</span>
          </button>

          <button
            onClick={() => setDateModalOpen(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Revise Ex-Factory Date</span>
          </button>
        </div>
      </div>

      {/* Grid: Overview Summary & Velocity Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Key Metadata */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account & Unit</div>
          <div className="text-sm font-bold text-slate-900">{order.buyer_name}</div>
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span>{order.unit_name}</span>
          </div>
          <div className="pt-2 border-t border-slate-100 text-xs flex justify-between">
            <span className="text-slate-500">Ex-Factory Date:</span>
            <span className="font-bold text-slate-900">{order.ex_factory_date}</span>
          </div>
          <div className="text-xs flex justify-between">
            <span className="text-slate-500">Ship Week:</span>
            <span className="font-mono font-semibold text-slate-700">{order.ship_week}</span>
          </div>
        </div>

        {/* Card 2: Production Progress */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Production Output</div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">
              {order.completed_quantity.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              of {order.total_quantity.toLocaleString()} pcs ({progressPct}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                order.health_status === 'RED' ? 'bg-rose-500' : order.health_status === 'AMBER' ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, progressPct)}%` }}
            />
          </div>
          <div className="pt-2 border-t border-slate-100 text-xs flex justify-between">
            <span className="text-slate-500">Defects Quarantined:</span>
            <span className="font-bold text-rose-600">{order.defect_quantity || 0} pcs</span>
          </div>
        </div>

        {/* Card 3: Velocity & Health */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Run-Rate Velocity</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xs text-slate-600 mt-1">
            Needed: <strong className="text-slate-900 font-bold">{Math.round(run_rate_projection?.pieces_needed_per_day || 0)} pcs/d</strong>
          </div>
          <div className="text-xs text-slate-600">
            Current Floor Output: <strong className="text-slate-900 font-bold">{Math.round(run_rate_projection?.pieces_made_per_day || 0)} pcs/d</strong>
          </div>
          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            Projected Finish: <strong className="text-slate-900">{run_rate_projection?.projected_completion_date}</strong>
          </div>
        </div>
      </div>

      {/* TNA Milestone Progress Timeline */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            Time-and-Action (TNA) Milestone Execution
          </h2>
          <span className="text-xs text-slate-500">Current Active Stage: <strong className="text-indigo-700">{order.current_stage}</strong></span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="pb-2">Milestone Stage</th>
                <th className="pb-2">Planned Start - End</th>
                <th className="pb-2">Actual Start - End</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {milestones.map((m: any) => (
                <tr key={m._id} className={m.stage_name === order.current_stage ? 'bg-indigo-50/40 font-semibold' : ''}>
                  <td className="py-2.5 font-medium text-slate-900 flex items-center gap-2">
                    {m.status === 'COMPLETED' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : m.status === 'IN_PROGRESS' ? (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping mr-1"></span>
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-slate-300 mr-1"></div>
                    )}
                    <span>{m.stage_name}</span>
                  </td>
                  <td className="py-2.5 text-slate-600">
                    {m.planned_start_date} to {m.planned_end_date}
                  </td>
                  <td className="py-2.5 text-slate-600">
                    {m.actual_start_date ? `${m.actual_start_date} to ${m.actual_end_date || 'In Progress'}` : '—'}
                  </td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      m.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : m.status === 'IN_PROGRESS'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Compliance Date Change Audit Trail */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Buyer Compliance Date Change Audit Trail
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">
            {audit_logs.length} logged revision(s)
          </span>
        </div>

        {audit_logs.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">
            No date revisions have been made. The order is running on its original contractual ex-factory schedule.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {audit_logs.map((a: any) => (
              <div key={a._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-slate-900 flex items-center gap-2">
                    <span>{a.milestone_name} ({a.field_changed})</span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {a.old_date} → <strong className="text-indigo-600">{a.new_date}</strong>
                    </span>
                  </div>
                  <div className="text-slate-600 text-xs mt-0.5">
                    <strong>Reason:</strong> {a.reason}
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-400 shrink-0">
                  <div>Revised by: <strong className="text-slate-700">{a.changed_by_name}</strong></div>
                  <div>{new Date(a.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Daily Production Logs Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600" />
            Floor Daily Production Entries
          </h2>
          <span className="text-xs text-slate-500">{daily_logs.length} supervisor logs</span>
        </div>

        {daily_logs.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">No daily production entries submitted yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Stage</th>
                  <th className="pb-2">Good Output</th>
                  <th className="pb-2">Defects</th>
                  <th className="pb-2">Supervisor</th>
                  <th className="pb-2">Photo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {daily_logs.map((log: any) => (
                  <tr key={log._id}>
                    <td className="py-2.5 font-mono text-slate-700">{log.date}</td>
                    <td className="py-2.5 font-medium text-slate-900">{log.stage_name}</td>
                    <td className="py-2.5 font-bold text-emerald-700 font-mono">+{log.quantity_produced.toLocaleString()} pcs</td>
                    <td className="py-2.5 text-rose-600 font-mono">{log.defect_count || 0}</td>
                    <td className="py-2.5 text-slate-600">{log.supervisor_name}</td>
                    <td className="py-2.5">
                      {log.photo_url ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600 font-semibold cursor-pointer">
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>View Proof</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <RunRateMathModal
        isOpen={mathModalOpen}
        onClose={() => setMathModalOpen(false)}
        poNumber={order.po_number}
        styleName={order.style_name}
        exFactoryDate={order.ex_factory_date}
        projection={run_rate_projection}
      />

      <DateChangeModal
        isOpen={dateModalOpen}
        onClose={() => setDateModalOpen(false)}
        orderId={order._id}
        poNumber={order.po_number}
        currentDate={order.ex_factory_date}
        onSuccess={fetchDetail}
      />
    </div>
  );
};


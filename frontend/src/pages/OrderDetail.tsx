import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { RunRateMathModal } from '../components/RunRateMathModal';
import { DateChangeModal } from '../components/DateChangeModal';
import { InfoButton } from '../components/InfoButton';
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
        <RefreshCw className="w-7 h-7 animate-spin mx-auto text-amber-600 mb-3" />
        <p className="text-xs font-semibold text-stone-600">Loading order details and compliance logs...</p>
      </div>
    );
  }

  if (!data || !data.order) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <p className="text-sm font-bold text-stone-800">Order not found</p>
        <button onClick={onBack} className="mt-3 text-xs text-amber-700 font-bold hover:underline">
          Back to Order Board
        </button>
      </div>
    );
  }

  const { order, milestones, daily_logs, issues, audit_logs, run_rate_projection } = data;
  const progressPct = Math.round((order.completed_quantity / order.total_quantity) * 100);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors"
            title="Back to board"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-base sm:text-lg font-bold text-stone-900 bg-stone-100 px-2.5 py-0.5 rounded border border-stone-200">
                {order.po_number}
              </span>
              <StatusBadge
                status={order.health_status}
                delayDays={run_rate_projection?.projected_delay_days || 0}
              />
            </div>
            <h1 className="text-xs sm:text-sm font-bold text-stone-700 mt-1">{order.style_name} ({order.color})</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMathModalOpen(true)}
            className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 border border-stone-200"
          >
            <Calculator className="w-3.5 h-3.5 text-stone-600" />
            <span>Run-Rate Math</span>
          </button>

          <button
            type="button"
            onClick={() => setDateModalOpen(true)}
            className="px-3.5 py-2 bg-[#1e2633] hover:bg-[#2c3749] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>Revise Ex-Factory Date</span>
          </button>
        </div>
      </div>

      {/* Grid: Overview Summary & Velocity Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
        {/* Card 1: Key Metadata */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2.5">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Account & Unit</div>
          <div className="text-sm font-bold text-stone-900">{order.buyer_name}</div>
          <div className="text-xs text-stone-500 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-stone-400" />
            <span>{order.unit_name}</span>
          </div>
          <div className="pt-2 border-t border-stone-100 text-xs flex justify-between">
            <span className="text-stone-500">Ex-Factory Date:</span>
            <span className="font-bold text-stone-900 font-mono">{order.ex_factory_date}</span>
          </div>
          <div className="text-xs flex justify-between">
            <span className="text-stone-500">Ship Week:</span>
            <span className="font-mono font-semibold text-stone-700">{order.ship_week}</span>
          </div>
        </div>

        {/* Card 2: Production Progress */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2.5">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Production Output</div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-stone-900">
              {order.completed_quantity.toLocaleString()}
            </span>
            <span className="text-xs text-stone-500 font-mono">
              of {order.total_quantity.toLocaleString()} pcs ({progressPct}%)
            </span>
          </div>
          <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                order.health_status === 'RED' ? 'bg-rose-600' : order.health_status === 'AMBER' ? 'bg-amber-500' : 'bg-emerald-600'
              }`}
              style={{ width: `${Math.min(100, progressPct)}%` }}
            />
          </div>
          <div className="pt-2 border-t border-stone-100 text-xs flex justify-between">
            <span className="text-stone-500">Defects Quarantined:</span>
            <span className="font-bold text-rose-700 font-mono">{order.defect_quantity || 0} pcs</span>
          </div>
        </div>

        {/* Card 3: Velocity & Health */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2 sm:col-span-2 md:col-span-1">
          <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
            <span>Run-Rate Velocity</span>
            <InfoButton
              align="right"
              title="Daily Run-Rate Calculation"
              content={
                <div className="space-y-1 text-stone-600">
                  <p><strong>Pieces Needed / Day:</strong> (Remaining pieces to produce) ÷ (Working days left excluding Sundays minus 2 buffer days).</p>
                  <p><strong>Pieces Made / Day:</strong> Rolling 3-day average output from supervisor logs.</p>
                </div>
              }
            />
          </div>
          <div className="text-xs text-stone-600">
            Needed: <strong className="text-stone-900 font-bold">{Math.round(run_rate_projection?.pieces_needed_per_day || 0)} pcs/d</strong>
          </div>
          <div className="text-xs text-stone-600">
            Current Floor Pace: <strong className="text-stone-900 font-bold">{Math.round(run_rate_projection?.pieces_made_per_day || 0)} pcs/d</strong>
          </div>
          <div className="pt-2 border-t border-stone-100 text-[11px] text-stone-500">
            Projected Finish: <strong className="text-stone-900 font-mono">{run_rate_projection?.projected_completion_date}</strong>
          </div>
        </div>
      </div>

      {/* TNA Milestone Progress Timeline */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-stone-600" />
            <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Time-and-Action (TNA) Milestone Execution
            </h2>
            <InfoButton
              align="left"
              title="TNA Milestones"
              content={
                <div className="space-y-1 text-stone-600">
                  <p>Standard 8-stage knitwear manufacturing timeline scheduled backwards from contractual ex-factory handover.</p>
                </div>
              }
            />
          </div>
          <span className="text-xs text-stone-500">Active Stage: <strong className="text-stone-900">{order.current_stage}</strong></span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="pb-2">Milestone Stage</th>
                <th className="pb-2">Planned Dates</th>
                <th className="pb-2">Actual Dates</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {milestones.map((m: any) => (
                <tr key={m._id} className={m.stage_name === order.current_stage ? 'bg-amber-50/40 font-semibold' : ''}>
                  <td className="py-2.5 font-medium text-stone-900 flex items-center gap-2">
                    {m.status === 'COMPLETED' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : m.status === 'IN_PROGRESS' ? (
                      <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping mr-1"></span>
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-stone-300 mr-1"></div>
                    )}
                    <span>{m.stage_name}</span>
                  </td>
                  <td className="py-2.5 text-stone-600 font-mono text-[11px]">
                    {m.planned_start_date} to {m.planned_end_date}
                  </td>
                  <td className="py-2.5 text-stone-600 font-mono text-[11px]">
                    {m.actual_start_date ? `${m.actual_start_date} to ${m.actual_end_date || 'In Progress'}` : '—'}
                  </td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      m.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : m.status === 'IN_PROGRESS'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-stone-100 text-stone-500'
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
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-stone-600" />
            <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
              Buyer Compliance Date Change Audit Trail
            </h2>
            <InfoButton
              align="left"
              title="Compliance Audit Log"
              content={
                <div className="space-y-1 text-stone-600">
                  <p>ISO 9001 and buyer governance mandate an immutable audit trail whenever contractual delivery dates are revised, logging who changed it, the previous date, and the verified reason.</p>
                </div>
              }
            />
          </div>
          <span className="text-[11px] text-stone-400">
            {audit_logs.length} logged revision(s)
          </span>
        </div>

        {audit_logs.length === 0 ? (
          <p className="text-xs text-stone-500 italic py-2">
            No date revisions have been made. The order is running on its contractual ex-factory schedule.
          </p>
        ) : (
          <div className="divide-y divide-stone-100 text-xs">
            {audit_logs.map((a: any) => (
              <div key={a._id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-semibold text-stone-900 flex items-center gap-2 flex-wrap">
                    <span>{a.milestone_name} ({a.field_changed})</span>
                    <span className="text-stone-400 font-mono text-[11px]">
                      {a.old_date} → <strong className="text-stone-900">{a.new_date}</strong>
                    </span>
                  </div>
                  <div className="text-stone-600 text-xs mt-0.5">
                    <strong>Reason:</strong> {a.reason}
                  </div>
                </div>
                <div className="text-left sm:text-right text-[11px] text-stone-400 shrink-0">
                  <div>Revised by: <strong className="text-stone-700">{a.changed_by_name}</strong></div>
                  <div>{new Date(a.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Daily Production Logs Table */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-stone-600" />
            <span>Floor Daily Production Entries</span>
          </h2>
          <span className="text-xs text-stone-500">{daily_logs.length} supervisor logs</span>
        </div>

        {daily_logs.length === 0 ? (
          <p className="text-xs text-stone-500 italic py-2">No daily production entries submitted yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 text-stone-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Stage</th>
                  <th className="pb-2">Good Output</th>
                  <th className="pb-2">Defects</th>
                  <th className="pb-2">Supervisor</th>
                  <th className="pb-2">Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {daily_logs.map((log: any) => (
                  <tr key={log._id}>
                    <td className="py-2.5 font-mono text-stone-700">{log.date}</td>
                    <td className="py-2.5 font-medium text-stone-900">{log.stage_name}</td>
                    <td className="py-2.5 font-bold text-emerald-800 font-mono">+{log.quantity_produced.toLocaleString()} pcs</td>
                    <td className="py-2.5 text-rose-700 font-mono">{log.defect_count || 0}</td>
                    <td className="py-2.5 text-stone-600">{log.supervisor_name}</td>
                    <td className="py-2.5">
                      {log.photo_url ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-semibold">
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>Photo Attached</span>
                        </span>
                      ) : (
                        <span className="text-stone-400 text-[11px]">—</span>
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

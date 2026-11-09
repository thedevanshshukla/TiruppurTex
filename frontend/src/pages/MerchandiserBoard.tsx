import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { RunRateMathModal } from '../components/RunRateMathModal';
import { DateChangeModal } from '../components/DateChangeModal';
import { InfoButton } from '../components/InfoButton';
import { 
  Filter, 
  Search, 
  Calculator, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle,
  AlertOctagon,
  ExternalLink,
  RefreshCw,
  Plus,
  Building2,
  Ship
} from 'lucide-react';

interface Order {
  _id: string;
  po_number: string;
  buyer_id: string;
  buyer_name: string;
  style_name: string;
  style_code: string;
  color: string;
  total_quantity: number;
  completed_quantity: number;
  current_stage: string;
  unit_name: string;
  unit_id: string;
  ex_factory_date: string;
  ship_week: string;
  health_status: string;
  run_rate_projection?: any;
}

interface MerchandiserBoardProps {
  onSelectOrder: (orderId: string) => void;
  onNavigateNewOrder: () => void;
}

export const MerchandiserBoard: React.FC<MerchandiserBoardProps> = ({
  onSelectOrder,
  onNavigateNewOrder,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBuyer, setSelectedBuyer] = useState('ALL');
  const [selectedUnit, setSelectedUnit] = useState('ALL');
  const [selectedShipWeek, setSelectedShipWeek] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [mathModalOrder, setMathModalOrder] = useState<Order | null>(null);
  const [dateModalOrder, setDateModalOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Compute summary metrics
  const totalOrders = orders.length;
  const greenCount = orders.filter((o) => o.health_status === 'GREEN').length;
  const amberCount = orders.filter((o) => o.health_status === 'AMBER').length;
  const redCount = orders.filter((o) => o.health_status === 'RED').length;
  const totalFinancialExposure = orders.reduce((acc, o) => {
    return acc + (o.run_rate_projection?.estimated_financial_loss_inr || 0);
  }, 0);

  // Unique filter values
  const buyers = Array.from(new Set(orders.map((o) => o.buyer_name))).filter(Boolean);
  const units = Array.from(new Set(orders.map((o) => o.unit_name))).filter(Boolean);
  const shipWeeks = Array.from(new Set(orders.map((o) => o.ship_week))).filter(Boolean);

  // Filtered orders
  const filteredOrders = orders.filter((order) => {
    if (selectedBuyer !== 'ALL' && order.buyer_name !== selectedBuyer) return false;
    if (selectedUnit !== 'ALL' && order.unit_name !== selectedUnit) return false;
    if (selectedShipWeek !== 'ALL' && order.ship_week !== selectedShipWeek) return false;
    if (statusFilter !== 'ALL' && order.health_status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        order.po_number.toLowerCase().includes(q) ||
        order.style_name.toLowerCase().includes(q) ||
        order.buyer_name.toLowerCase().includes(q) ||
        order.current_stage.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-5">
      {/* Top Title & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">Production Order Board</h1>
          <InfoButton
            align="left"
            title="Production Board & Run-Rate Delay System"
            content={
              <div className="space-y-1.5 text-stone-600">
                <p><strong>Two-Week Early Warning:</strong> Replaces phone calls and Excel chasing with automated daily floor velocity calculations.</p>
                <p><strong>Status Rules:</strong></p>
                <ul className="list-disc pl-4 space-y-0.5 text-[10px]">
                  <li><strong className="text-emerald-700">Green (On Track):</strong> Floor output velocity meets or exceeds target run-rate.</li>
                  <li><strong className="text-amber-700">Amber (Warning):</strong> 1–4 days variance. Actionable via overtime or line balancing.</li>
                  <li><strong className="text-rose-700">Red (Critical):</strong> &gt;4 days delay. High risk of missing container cut-off (air freight penalty).</li>
                </ul>
              </div>
            }
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchOrders}
            className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl border border-stone-200 transition-colors"
            title="Refresh order run-rates"
            aria-label="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={onNavigateNewOrder}
            className="px-3.5 py-2 bg-[#1e2633] hover:bg-[#2c3749] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Create New PO</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Ribbon - Warm, Balanced Tone */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-[#e8e6e1] shadow-2xs">
          <div className="text-[10px] sm:text-xs font-semibold text-stone-500 uppercase tracking-wider">Active POs</div>
          <div className="text-xl sm:text-2xl font-black text-stone-900 mt-1">{totalOrders}</div>
          <div className="text-[10px] sm:text-[11px] text-stone-400 mt-0.5">UK & EU accounts</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-[#bbf7d0] shadow-2xs bg-[#f0fdf4]/50">
          <div className="text-[10px] sm:text-xs font-semibold text-[#166534] uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>On Track</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#15803d] mt-1">{greenCount}</div>
          <div className="text-[10px] sm:text-[11px] text-[#166534]/80 mt-0.5">Meeting ex-factory</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-[#fde68a] shadow-2xs bg-[#fffbeb]/60">
          <div className="text-[10px] sm:text-xs font-semibold text-[#92400e] uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Amber Warning</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#b45309] mt-1">{amberCount}</div>
          <div className="text-[10px] sm:text-[11px] text-[#92400e]/80 mt-0.5">1–4 days variance</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-[#fecaca] shadow-2xs bg-[#fef2f2]/60">
          <div className="text-[10px] sm:text-xs font-semibold text-[#991b1b] uppercase tracking-wider flex items-center gap-1">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Critical Delay</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#b91c1c] mt-1">{redCount}</div>
          <div className="text-[10px] sm:text-[11px] text-[#991b1b]/80 mt-0.5">&gt;4d delay (Air risk)</div>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-[#1e2633] p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-stone-800 text-white shadow-2xs">
          <div className="text-[10px] sm:text-xs font-semibold text-stone-300 uppercase tracking-wider flex items-center justify-between">
            <span>Penalty Risk</span>
            <InfoButton
              align="right"
              title="Financial Penalty Exposure"
              content={
                <div className="space-y-1 text-stone-600 text-[10px]">
                  <p>Company A loses ₹1.08 Cr/year to delivery penalties. This counter tracks the active risk:</p>
                  <p>• <strong>Air Freight Surcharge (₹3.5L):</strong> When delay &ge; 6 days, vessel cutoff is missed.</p>
                  <p>• <strong>Buyer 5% Penalty (~₹1.05L):</strong> When delay is 2–5 days.</p>
                </div>
              }
            />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1">
            ₹{(totalFinancialExposure / 100000).toFixed(1)}L
          </div>
          <div className="text-[10px] sm:text-[11px] text-stone-400 mt-0.5">Air freight & discount risk</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-[#e8e6e1] shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search PO, style name, buyer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#faf8f3] text-stone-900 rounded-lg text-xs border border-stone-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 font-medium"
            />
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'GREEN', 'AMBER', 'RED'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  statusFilter === st
                    ? 'bg-[#1e2633] text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {st === 'ALL' ? 'All' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdowns row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-stone-100 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
              Buyer
            </label>
            <select
              value={selectedBuyer}
              onChange={(e) => setSelectedBuyer(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#faf8f3] rounded-lg border border-stone-200 text-xs font-medium focus:bg-white focus:outline-hidden"
            >
              <option value="ALL">All Buyers</option>
              {buyers.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
              Unit / Subcontractor
            </label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#faf8f3] rounded-lg border border-stone-200 text-xs font-medium focus:bg-white focus:outline-hidden"
            >
              <option value="ALL">All Units & Subcontractors</option>
              {units.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
              Ship Week
            </label>
            <select
              value={selectedShipWeek}
              onChange={(e) => setSelectedShipWeek(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#faf8f3] rounded-lg border border-stone-200 text-xs font-medium focus:bg-white focus:outline-hidden"
            >
              <option value="ALL">All Ship Weeks</option>
              {shipWeeks.map((sw) => (
                <option key={sw} value={sw}>{sw}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders List / Cards */}
      {loading ? (
        <div className="bg-white p-10 rounded-2xl border border-[#e8e6e1] text-center">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto text-amber-600 mb-2" />
          <p className="text-xs font-semibold text-stone-600">Calculating floor velocity and run-rates...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-[#e8e6e1] text-center">
          <Filter className="w-6 h-6 text-stone-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-stone-800">No orders match filters</p>
          <p className="text-xs text-stone-500 mt-0.5">Try resetting buyer, unit, or status filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const proj = order.run_rate_projection;
            const delayDays = proj?.projected_delay_days || 0;
            const progressPct = Math.round((order.completed_quantity / order.total_quantity) * 100);

            return (
              <div
                key={order._id}
                className="bg-white rounded-xl sm:rounded-2xl border border-[#e8e6e1] shadow-2xs hover:border-stone-300 transition-all p-4 sm:p-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
                  {/* Left: PO & Style Details */}
                  <div className="space-y-1 sm:min-w-[260px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs sm:text-sm font-black text-stone-900 bg-[#faf8f3] px-2 py-0.5 rounded border border-stone-200">
                        {order.po_number}
                      </span>
                      <StatusBadge status={order.health_status} delayDays={delayDays} />
                      <span className="text-[10px] sm:text-[11px] font-semibold text-stone-500 bg-stone-50 px-2 py-0.5 rounded border border-stone-200 flex items-center gap-1">
                        <Ship className="w-3 h-3 text-stone-400" />
                        {order.ship_week}
                      </span>
                    </div>

                    <div className="text-xs sm:text-sm font-bold text-stone-900 flex items-center gap-1.5">
                      <span>{order.style_name}</span>
                      <span className="text-stone-400 font-normal text-xs">({order.color})</span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-stone-500 flex-wrap">
                      <span className="font-semibold text-stone-700">{order.buyer_name}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-stone-400" />
                        {order.unit_name}
                      </span>
                    </div>
                  </div>

                  {/* Center: Stage Progress & Output Velocity */}
                  <div className="flex-1 lg:max-w-md space-y-1.5">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-600"></span>
                        {order.current_stage}
                      </span>
                      <span className="font-mono text-stone-700 font-bold text-[11px] sm:text-xs">
                        {order.completed_quantity.toLocaleString()} / {order.total_quantity.toLocaleString()} pcs ({progressPct}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-[#f1efea] rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          order.health_status === 'RED'
                            ? 'bg-[#dc2626]'
                            : order.health_status === 'AMBER'
                            ? 'bg-[#d97706]'
                            : 'bg-[#15803d]'
                        }`}
                        style={{ width: `${Math.min(100, progressPct)}%` }}
                      />
                    </div>

                    {/* Velocity Tag */}
                    {proj && (
                      <div className="flex items-center justify-between text-[11px] text-stone-500">
                        <span>
                          Target: <strong className="text-stone-800 font-semibold">{Math.round(proj.pieces_needed_per_day)} pcs/d</strong>
                        </span>
                        <span>
                          Floor Output: <strong className={order.health_status === 'RED' ? 'text-rose-700 font-bold' : 'text-stone-800 font-semibold'}>{Math.round(proj.pieces_made_per_day)} pcs/d</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right: Dates & Action Buttons */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-2.5 border-t lg:border-t-0 pt-2.5 lg:pt-0">
                    <div className="text-left lg:text-right">
                      <div className="text-[11px] text-stone-600 flex items-center lg:justify-end gap-1">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        <span>Ex-Factory: <strong>{order.ex_factory_date}</strong></span>
                      </div>
                      {proj && (
                        <div className="text-[10px] text-stone-400">
                          Est. finish: {proj.projected_completion_date}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setMathModalOrder(order)}
                        className="px-2.5 py-1.5 bg-[#faf8f3] hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 border border-stone-200"
                        title="View mathematical run-rate calculation"
                      >
                        <Calculator className="w-3.5 h-3.5 text-stone-600" />
                        <span>Math</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDateModalOrder(order)}
                        className="px-2.5 py-1.5 bg-[#faf8f3] hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 border border-stone-200"
                        title="Reschedule ex-factory date with audit log"
                      >
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        <span>Date</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectOrder(order._id)}
                        className="px-3 py-1.5 bg-[#1e2633] hover:bg-[#2c3749] text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <span>TNA</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Run-Rate Math Breakdown Modal */}
      <RunRateMathModal
        isOpen={!!mathModalOrder}
        onClose={() => setMathModalOrder(null)}
        poNumber={mathModalOrder?.po_number || ''}
        styleName={mathModalOrder?.style_name || ''}
        exFactoryDate={mathModalOrder?.ex_factory_date || ''}
        projection={mathModalOrder?.run_rate_projection || null}
      />

      {/* Compliance Date Revision Modal */}
      <DateChangeModal
        isOpen={!!dateModalOrder}
        onClose={() => setDateModalOrder(null)}
        orderId={dateModalOrder?._id || ''}
        poNumber={dateModalOrder?.po_number || ''}
        currentDate={dateModalOrder?.ex_factory_date || ''}
        onSuccess={fetchOrders}
      />
    </div>
  );
};

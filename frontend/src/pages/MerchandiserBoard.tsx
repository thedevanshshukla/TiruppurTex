import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { RunRateMathModal } from '../components/RunRateMathModal';
import { DateChangeModal } from '../components/DateChangeModal';
import { 
  Filter, 
  Search, 
  Calculator, 
  Calendar, 
  Clock, 
  AlertOctagon, 
  CheckCircle2, 
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Plus,
  TrendingUp,
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Title & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Production Order Board</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time shop floor velocity tracking & 2-week early delay warning system
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchOrders}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
            title="Refresh order run-rates"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onNavigateNewOrder}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create New PO</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Active POs</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{totalOrders}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">UK & EU export accounts</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20">
          <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            On Track (Green)
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{greenCount}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">Velocity meeting ex-factory</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs bg-amber-50/20">
          <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Warning (Amber)
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">{amberCount}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">1–4 days variance (Actionable)</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs bg-rose-50/20">
          <div className="text-xs font-semibold text-rose-700 uppercase tracking-wider flex items-center gap-1">
            <AlertOctagon className="w-3.5 h-3.5" />
            Critical Delay (Red)
          </div>
          <div className="text-2xl font-black text-rose-700 mt-1">{redCount}</div>
          <div className="text-[11px] text-rose-600 mt-0.5">&gt;4 days delay (Air risk)</div>
        </div>

        <div className="col-span-2 lg:col-span-1 bg-white p-4 rounded-2xl border border-slate-900 shadow-xs bg-slate-900 text-white">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Late Penalty At Risk</div>
          <div className="text-2xl font-black text-rose-400 mt-1">
            ₹{(totalFinancialExposure / 100000).toFixed(1)}L
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Air freight & discount risk</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by PO number, style name, buyer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 text-slate-900 rounded-xl text-xs border border-slate-200 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          {/* Status Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'GREEN', 'AMBER', 'RED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All Status' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdowns row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Buyer Account
            </label>
            <select
              value={selectedBuyer}
              onChange={(e) => setSelectedBuyer(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-medium focus:bg-white focus:outline-hidden"
            >
              <option value="ALL">All Buyers</option>
              {buyers.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Production Unit
            </label>
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-medium focus:bg-white focus:outline-hidden"
            >
              <option value="ALL">All Units & Subcontractors</option>
              {units.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Ex-Factory Ship Week
            </label>
            <select
              value={selectedShipWeek}
              onChange={(e) => setSelectedShipWeek(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200 text-xs font-medium focus:bg-white focus:outline-hidden"
            >
              <option value="ALL">All Ship Weeks</option>
              {shipWeeks.map((sw) => (
                <option key={sw} value={sw}>{sw}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders List / Table */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
          <p className="text-xs font-semibold text-slate-600">Calculating floor velocity and run-rates...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <Filter className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800">No orders match the selected filters</p>
          <p className="text-xs text-slate-500 mt-1">Try resetting the buyer, unit, or status filters.</p>
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
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-indigo-300 transition-all p-5"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: PO & Style Details */}
                  <div className="space-y-1.5 min-w-[280px]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {order.po_number}
                      </span>
                      <StatusBadge status={order.health_status} delayDays={delayDays} />
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                        <Ship className="w-3 h-3 text-slate-400" />
                        {order.ship_week}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>{order.style_name}</span>
                      <span className="text-slate-400 font-normal">({order.color})</span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                      <span className="font-medium text-slate-700">{order.buyer_name}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {order.unit_name}
                      </span>
                    </div>
                  </div>

                  {/* Center: Stage Progress & Output Velocity */}
                  <div className="flex-1 max-w-md space-y-2">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-semibold text-indigo-700 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                        Current Stage: {order.current_stage}
                      </span>
                      <span className="font-mono text-slate-700 font-bold">
                        {order.completed_quantity.toLocaleString()} / {order.total_quantity.toLocaleString()} pcs ({progressPct}%)
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          order.health_status === 'RED'
                            ? 'bg-rose-500'
                            : order.health_status === 'AMBER'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, progressPct)}%` }}
                      />
                    </div>

                    {/* Velocity Tag */}
                    {proj && (
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          Needed: <strong className="text-slate-800">{Math.round(proj.pieces_needed_per_day)} pcs/d</strong>
                        </span>
                        <span>
                          Floor Output: <strong className={`${order.health_status === 'RED' ? 'text-rose-600' : 'text-slate-800'}`}>{Math.round(proj.pieces_made_per_day)} pcs/d</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right: Dates & Action Buttons */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 border-t lg:border-t-0 pt-3 lg:pt-0">
                    <div className="text-left lg:text-right">
                      <div className="text-[11px] text-slate-500 flex items-center lg:justify-end gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Ex-Factory: <strong className="text-slate-900 font-semibold">{order.ex_factory_date}</strong>
                      </div>
                      {proj && (
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Projected finish: <span className="font-semibold">{proj.projected_completion_date}</span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setMathModalOrder(order)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                        title="View mathematical run-rate calculation"
                      >
                        <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Math</span>
                      </button>

                      <button
                        onClick={() => setDateModalOrder(order)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
                        title="Reschedule ex-factory date with audit log"
                      >
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        <span>Date Log</span>
                      </button>

                      <button
                        onClick={() => onSelectOrder(order._id)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <span>TNA View</span>
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


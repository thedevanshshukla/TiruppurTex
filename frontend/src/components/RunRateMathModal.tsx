import React from 'react';
import { X, Calculator, AlertOctagon, TrendingUp, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface RunRateProjection {
  total_quantity: number;
  completed_quantity: number;
  remaining_quantity: number;
  working_days_left: number;
  pieces_needed_per_day: number;
  pieces_made_per_day: number;
  projected_completion_date: string;
  projected_delay_days: number;
  status: string;
  air_freight_risk: boolean;
  discount_risk: boolean;
  estimated_financial_loss_inr: number;
  math_explanation: string;
}

interface RunRateMathModalProps {
  isOpen: boolean;
  onClose: () => void;
  poNumber: string;
  styleName: string;
  exFactoryDate: string;
  projection: RunRateProjection | null;
}

export const RunRateMathModal: React.FC<RunRateMathModalProps> = ({
  isOpen,
  onClose,
  poNumber,
  styleName,
  exFactoryDate,
  projection,
}) => {
  if (!isOpen || !projection) return null;

  const paceRatio = projection.pieces_needed_per_day > 0 
    ? Math.round((projection.pieces_made_per_day / projection.pieces_needed_per_day) * 100) 
    : 100;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in fade-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base tracking-tight flex items-center gap-2">
                <span>Run-Rate Delay Projection Engine</span>
                <span className="text-xs font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                  {poNumber}
                </span>
              </h3>
              <p className="text-xs text-slate-400">{styleName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Ribbon */}
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            projection.status === 'RED' 
              ? 'bg-rose-50 border-rose-200 text-rose-900' 
              : projection.status === 'AMBER'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            {projection.status === 'RED' && <AlertOctagon className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />}
            {projection.status === 'AMBER' && <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />}
            {projection.status === 'GREEN' && <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />}
            <div>
              <div className="font-bold text-sm">
                Status: {projection.status} {projection.projected_delay_days > 0 ? `(+${projection.projected_delay_days} days projected delay)` : '(On Schedule)'}
              </div>
              <div className="text-xs mt-1 leading-relaxed">
                {projection.math_explanation}
              </div>
            </div>
          </div>

          {/* Core Formula Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Target Pace */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                Target Run-Rate Needed
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900">
                  {Math.round(projection.pieces_needed_per_day)}
                </span>
                <span className="text-xs text-slate-600 font-medium">pcs / workday</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-2 font-mono bg-white p-2 rounded border border-slate-200/80">
                Formula: {projection.remaining_quantity.toLocaleString()} pcs remaining ÷ {projection.working_days_left} workdays
              </div>
            </div>

            {/* Actual Floor Pace */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                Current Floor Output Pace
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900">
                  {Math.round(projection.pieces_made_per_day)}
                </span>
                <span className="text-xs text-slate-600 font-medium">pcs / workday</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-2 font-mono bg-white p-2 rounded border border-slate-200/80">
                Rolling 3-day average from floor supervisor logs
              </div>
            </div>
          </div>

          {/* Mathematical Timeline Breakdown */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Mathematical Derivation & Projection
            </h4>
            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Contractual Ex-Factory Date:</span>
                <span className="font-semibold text-slate-900">{exFactoryDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Total Order / Completed Pieces:</span>
                <span className="font-semibold text-slate-900">
                  {projection.completed_quantity.toLocaleString()} / {projection.total_quantity.toLocaleString()} pcs ({Math.round((projection.completed_quantity / projection.total_quantity) * 100)}%)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Remaining Balance to Produce:</span>
                <span className="font-bold text-slate-900">{projection.remaining_quantity.toLocaleString()} pcs</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Production Velocity Ratio:</span>
                <span className={`font-bold ${paceRatio >= 90 ? 'text-emerald-600' : paceRatio >= 65 ? 'text-amber-600' : 'text-rose-600'}`}>
                  {paceRatio}% of required velocity
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Projected Factory Completion:</span>
                <span className="font-bold text-slate-900">{projection.projected_completion_date}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Projected Variance / Delay:</span>
                <span className={`font-bold ${projection.projected_delay_days > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {projection.projected_delay_days > 0 ? `+${projection.projected_delay_days} days late` : '0 days (On Schedule)'}
                </span>
              </div>
            </div>
          </div>

          {/* Financial Risk Impact (Tiruppur Business Model) */}
          {projection.estimated_financial_loss_inr > 0 && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                    Projected Financial Penalty Risk
                  </div>
                  <div className="text-xs text-rose-700 mt-1">
                    {projection.air_freight_risk
                      ? 'High risk of sea-freight vessel cancellation requiring emergency air cargo.'
                      : 'High risk of buyer contractual 5% late discount deduction.'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-rose-700">
                    ₹{projection.estimated_financial_loss_inr.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-rose-600 font-semibold uppercase">
                    {projection.air_freight_risk ? 'Air Freight Surcharge' : '5% Buyer Discount'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors"
          >
            Close Math View
          </button>
        </div>
      </div>
    </div>
  );
};


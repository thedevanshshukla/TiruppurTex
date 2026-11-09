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
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/40 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-[#1e2633] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base tracking-tight flex items-center gap-2">
                <span>Run-Rate Delay Projection Engine</span>
                <span className="text-xs font-mono bg-[#2a3648] px-2 py-0.5 rounded text-stone-200">
                  {poNumber}
                </span>
              </h3>
              <p className="text-xs text-stone-400">{styleName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Status Ribbon */}
          <div className={`p-3.5 sm:p-4 rounded-xl border flex items-start gap-3 ${
            projection.status === 'RED' 
              ? 'bg-rose-50/80 border-rose-200 text-rose-900' 
              : projection.status === 'AMBER'
              ? 'bg-amber-50/80 border-amber-200 text-amber-900'
              : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
          }`}>
            {projection.status === 'RED' && <AlertOctagon className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />}
            {projection.status === 'AMBER' && <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />}
            {projection.status === 'GREEN' && <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />}
            <div>
              <div className="font-bold text-xs sm:text-sm">
                Status: {projection.status} {projection.projected_delay_days > 0 ? `(+${projection.projected_delay_days} days projected delay)` : '(On Schedule)'}
              </div>
              <div className="text-xs mt-1 leading-relaxed">
                {projection.math_explanation}
              </div>
            </div>
          </div>

          {/* Core Formula Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Target Pace */}
            <div className="bg-stone-50/70 p-3.5 sm:p-4 rounded-xl border border-stone-200">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-stone-600" />
                Target Run-Rate Needed
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-stone-900">
                  {Math.round(projection.pieces_needed_per_day)}
                </span>
                <span className="text-xs text-stone-600 font-medium">pcs / workday</span>
              </div>
              <div className="text-[11px] text-stone-500 mt-2 font-mono bg-white p-2 rounded border border-stone-200">
                Formula: {projection.remaining_quantity.toLocaleString()} pcs remaining ÷ {projection.working_days_left} workdays
              </div>
            </div>

            {/* Actual Floor Pace */}
            <div className="bg-stone-50/70 p-3.5 sm:p-4 rounded-xl border border-stone-200">
              <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-stone-600" />
                Current Floor Pace
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-stone-900">
                  {Math.round(projection.pieces_made_per_day)}
                </span>
                <span className="text-xs text-stone-600 font-medium">pcs / workday</span>
              </div>
              <div className="text-[11px] text-stone-500 mt-2 font-mono bg-white p-2 rounded border border-stone-200">
                Rolling 3-day average from floor supervisor logs
              </div>
            </div>
          </div>

          {/* Mathematical Timeline Breakdown */}
          <div className="border border-stone-200 rounded-xl p-3.5 sm:p-4 bg-white space-y-2.5">
            <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
              Mathematical Derivation & Breakdown
            </h4>
            <div className="space-y-1.5 text-xs text-stone-700">
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Ex-Factory Date:</span>
                <span className="font-semibold text-stone-900 font-mono">{exFactoryDate}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Total / Done:</span>
                <span className="font-semibold text-stone-900">
                  {projection.completed_quantity.toLocaleString()} / {projection.total_quantity.toLocaleString()} pcs ({Math.round((projection.completed_quantity / projection.total_quantity) * 100)}%)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Remaining to Make:</span>
                <span className="font-bold text-stone-900">{projection.remaining_quantity.toLocaleString()} pcs</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Velocity Ratio:</span>
                <span className={`font-bold ${paceRatio >= 90 ? 'text-emerald-700' : paceRatio >= 65 ? 'text-amber-700' : 'text-rose-700'}`}>
                  {paceRatio}% of required velocity
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Projected Completion:</span>
                <span className="font-bold text-stone-900 font-mono">{projection.projected_completion_date}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-stone-500">Projected Variance:</span>
                <span className={`font-bold ${projection.projected_delay_days > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {projection.projected_delay_days > 0 ? `+${projection.projected_delay_days} days late` : '0 days (On Schedule)'}
                </span>
              </div>
            </div>
          </div>

          {/* Financial Risk Impact (Tiruppur Business Model) */}
          {projection.estimated_financial_loss_inr > 0 && (
            <div className="p-3.5 sm:p-4 bg-rose-50/80 border border-rose-200 rounded-xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                    Projected Financial Penalty Risk
                  </div>
                  <div className="text-xs text-rose-700 mt-0.5">
                    {projection.air_freight_risk
                      ? 'Risk of sea-freight vessel cancellation requiring emergency air cargo.'
                      : 'Risk of buyer contractual 5% late delivery discount deduction.'}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-base sm:text-lg font-black text-rose-700 font-mono">
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
        <div className="px-5 sm:px-6 py-3 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#1e2633] hover:bg-[#2c3749] text-white text-xs font-bold rounded-xl transition-colors"
          >
            Close Math View
          </button>
        </div>
      </div>
    </div>
  );
};

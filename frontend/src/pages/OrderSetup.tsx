import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { InfoButton } from '../components/InfoButton';
import { ArrowLeft, Plus, Trash2, Calendar, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface SizeItem {
  size: string;
  quantity: number;
}

interface OrderSetupProps {
  onBack: () => void;
  onSuccess: (orderId: string) => void;
}

export const OrderSetup: React.FC<OrderSetupProps> = ({ onBack, onSuccess }) => {
  const [poNumber, setPoNumber] = useState('');
  const [buyerId, setBuyerId] = useState('');
  const [styleName, setStyleName] = useState('');
  const [styleCode, setStyleCode] = useState('');
  const [color, setColor] = useState('');
  const [unitId, setUnitId] = useState('');
  const [exFactoryDate, setExFactoryDate] = useState('2026-12-05');
  const [sizes, setSizes] = useState<SizeItem[]>([
    { size: 'S', quantity: 2000 },
    { size: 'M', quantity: 4000 },
    { size: 'L', quantity: 3000 },
    { size: 'XL', quantity: 1000 },
  ]);

  const [buyers, setBuyers] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([apiClient.get('/meta/buyers'), apiClient.get('/meta/units')])
      .then(([bRes, uRes]) => {
        setBuyers(bRes.data);
        setUnits(uRes.data);
        if (bRes.data.length > 0) setBuyerId(bRes.data[0]._id);
        if (uRes.data.length > 0) setUnitId(uRes.data[0]._id);
      })
      .catch((e) => console.error('Failed to load lookups', e))
      .finally(() => setLoadingLookups(false));
  }, []);

  const totalQuantity = sizes.reduce((acc, s) => acc + (Number(s.quantity) || 0), 0);

  const handleSizeChange = (index: number, field: 'size' | 'quantity', val: any) => {
    const updated = [...sizes];
    if (field === 'size') {
      updated[index].size = val;
    } else {
      updated[index].quantity = Math.max(0, parseInt(val, 10) || 0);
    }
    setSizes(updated);
  };

  const addSizeRow = () => {
    setSizes([...sizes, { size: 'XXL', quantity: 500 }]);
  };

  const removeSizeRow = (index: number) => {
    if (sizes.length <= 1) return;
    setSizes(sizes.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poNumber.trim()) {
      setError('PO number is required.');
      return;
    }
    if (totalQuantity <= 0) {
      setError('Total quantity must be greater than zero.');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await apiClient.post('/orders', {
        po_number: poNumber.trim().toUpperCase(),
        buyer_id: buyerId,
        style_name: styleName.trim(),
        style_code: styleCode.trim() || 'STY-001',
        color: color.trim() || 'Assorted',
        total_quantity: totalQuantity,
        size_breakdown: sizes,
        unit_id: unitId,
        ex_factory_date: exFactoryDate,
        current_stage: 'Fabric Sourcing & Dyeing',
      });
      onSuccess(res.data.order_id);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors"
          title="Back"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">New Order Setup</h1>
            <InfoButton
              align="left"
              title="Automated TNA Milestone Planning"
              content={
                <div className="space-y-1 text-stone-600">
                  <p>When you create an export PO, standard 28-day knitwear lead times are scheduled backwards from your Ex-Factory handover date.</p>
                  <p>Stages include: Fabric Sourcing → Cutting → Printing → Stitching → Washing → Finishing → Final QC.</p>
                </div>
              }
            />
          </div>
          <p className="text-xs text-stone-500">
            Create export PO with size matrix and automated Time-and-Action (TNA) milestones
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Card 1: Core Order & Buyer Metadata */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>1. Contractual Order Details</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Purchase Order (PO) Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. B-PO-88299"
                value={poNumber}
                onChange={(e) => setPoNumber(e.target.value)}
                className="w-full h-11 px-3 bg-stone-50 text-stone-900 rounded-xl text-xs font-mono font-bold border border-stone-300 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Buyer Account *
              </label>
              <select
                required
                value={buyerId}
                onChange={(e) => setBuyerId(e.target.value)}
                className="w-full h-11 px-3 bg-stone-50 text-stone-900 rounded-xl text-xs font-medium border border-stone-300 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              >
                {buyers.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name} ({b.country})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Garment Style Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Men's heavy jersey crew neck tee"
                value={styleName}
                onChange={(e) => setStyleName(e.target.value)}
                className="w-full h-11 px-3 bg-stone-50 text-stone-900 rounded-xl text-xs font-medium border border-stone-300 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Style Code
                </label>
                <input
                  type="text"
                  placeholder="TSH-901"
                  value={styleCode}
                  onChange={(e) => setStyleCode(e.target.value)}
                  className="w-full h-11 px-3 bg-stone-50 text-stone-900 rounded-xl text-xs font-medium border border-stone-300 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Colorway
                </label>
                <input
                  type="text"
                  placeholder="Navy / Heather"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full h-11 px-3 bg-stone-50 text-stone-900 rounded-xl text-xs font-medium border border-stone-300 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Assigned Production Unit *
              </label>
              <select
                required
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="w-full h-11 px-3 bg-stone-50 text-stone-900 rounded-xl text-xs font-medium border border-stone-300 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              >
                {units.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Contractual Ex-Factory Date *
              </label>
              <input
                type="date"
                required
                value={exFactoryDate}
                onChange={(e) => setExFactoryDate(e.target.value)}
                className="w-full h-11 px-3 bg-stone-50 text-stone-900 rounded-xl text-xs font-medium border border-stone-300 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Size Matrix & Total Pieces */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  2. Size Breakdown & Quantity Matrix
                </h2>
                <InfoButton
                  align="left"
                  title="Size Matrix"
                  content={
                    <div className="space-y-1 text-stone-600">
                      <p>Enter the expected distribution by size. Floor supervisors can report production by individual stage against this lot total.</p>
                    </div>
                  }
                />
              </div>
              <p className="text-[11px] text-stone-500">Standard export scale distribution</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-stone-500">Total:</span>
              <span className="text-sm sm:text-base font-black text-stone-900 ml-1.5 font-mono">
                {totalQuantity.toLocaleString()} pcs
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {sizes.map((s, idx) => (
              <div key={idx} className="flex items-center gap-2 sm:gap-3">
                <input
                  type="text"
                  placeholder="Size"
                  value={s.size}
                  onChange={(e) => handleSizeChange(idx, 'size', e.target.value)}
                  className="w-20 sm:w-24 h-10 px-2 sm:px-3 bg-stone-50 text-stone-900 rounded-xl text-xs font-bold border border-stone-300 text-center uppercase"
                />
                <input
                  type="number"
                  min="0"
                  step="50"
                  placeholder="Pieces"
                  value={s.quantity}
                  onChange={(e) => handleSizeChange(idx, 'quantity', e.target.value)}
                  className="flex-1 h-10 px-3 bg-stone-50 text-stone-900 rounded-xl text-xs font-mono font-medium border border-stone-300"
                />
                <button
                  type="button"
                  onClick={() => removeSizeRow(idx)}
                  disabled={sizes.length <= 1}
                  className="p-2 text-stone-400 hover:text-rose-600 disabled:opacity-30 rounded-lg transition-colors"
                  aria-label="Remove size"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addSizeRow}
            className="text-xs text-amber-700 hover:text-amber-800 font-bold flex items-center gap-1 mt-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Size Option</span>
          </button>
        </div>

        {/* Card 3: TNA Milestone Template Preview */}
        <div className="bg-[#1e2633] text-white p-4 sm:p-6 rounded-2xl shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>3. Automated Time-and-Action (TNA) Milestone Plan</span>
              </h2>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Calculated backwards from Ex-Factory Date ({exFactoryDate}) using Tiruppur export lead-times
              </p>
            </div>
            <span className="text-[10px] font-mono bg-[#2a3648] text-amber-300 px-2.5 py-1 rounded-full border border-stone-600 self-start sm:self-auto">
              Template: Knitwear Standard (28-day)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
            <div className="p-2.5 bg-[#2a3648] rounded-xl border border-stone-700">
              <div className="text-[10px] text-stone-400">1. Fabric & Dyeing</div>
              <div className="font-semibold text-stone-200 mt-0.5">Day -28 to -20</div>
            </div>
            <div className="p-2.5 bg-[#2a3648] rounded-xl border border-stone-700">
              <div className="text-[10px] text-stone-400">2. Cutting & Prep</div>
              <div className="font-semibold text-stone-200 mt-0.5">Day -20 to -16</div>
            </div>
            <div className="p-2.5 bg-[#2a3648] rounded-xl border border-stone-700">
              <div className="text-[10px] text-stone-400">3. Printing / Emb</div>
              <div className="font-semibold text-stone-200 mt-0.5">Day -16 to -12</div>
            </div>
            <div className="p-2.5 bg-[#2a3648] rounded-xl border border-stone-700">
              <div className="text-[10px] text-stone-400">4. Stitching & Assy</div>
              <div className="font-semibold text-stone-200 mt-0.5">Day -12 to -5</div>
            </div>
            <div className="p-2.5 bg-[#2a3648] rounded-xl border border-stone-700">
              <div className="text-[10px] text-stone-400">5. Washing</div>
              <div className="font-semibold text-stone-200 mt-0.5">Day -5 to -3</div>
            </div>
            <div className="p-2.5 bg-[#2a3648] rounded-xl border border-stone-700">
              <div className="text-[10px] text-stone-400">6. Finishing & Ironing</div>
              <div className="font-semibold text-stone-200 mt-0.5">Day -3 to -1</div>
            </div>
            <div className="p-2.5 bg-[#2a3648] rounded-xl border border-stone-700">
              <div className="text-[10px] text-stone-400">7. Final QC & Packing</div>
              <div className="font-semibold text-stone-200 mt-0.5">Day -1 to 0</div>
            </div>
            <div className="p-2.5 bg-amber-500/20 rounded-xl border border-amber-500/40">
              <div className="text-[10px] text-amber-300">8. Ex-Factory Handover</div>
              <div className="font-bold text-white mt-0.5">{exFactoryDate}</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2.5 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 bg-[#1e2633] hover:bg-[#2c3749] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 disabled:opacity-50"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Create PO & Instantiate TNA Milestones</span>
          </button>
        </div>
      </form>
    </div>
  );
};

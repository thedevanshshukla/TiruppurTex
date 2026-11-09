import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import { InfoButton } from '../components/InfoButton';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  ArrowLeft, 
  RefreshCw,
  Building,
  Calendar
} from 'lucide-react';

interface ExportReportProps {
  onBack: () => void;
}

export const ExportReport: React.FC<ExportReportProps> = ({ onBack }) => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchExport = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/buyer/weekly-export');
      setReport(res.data);
    } catch (err) {
      console.error('Failed to load export report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExport();
  }, []);

  const handleDownloadCsv = () => {
    if (!report || !report.data || report.data.length === 0) return;
    const headers = Object.keys(report.data[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const row of report.data) {
      const values = headers.map((h) => {
        const val = row[h] !== undefined ? String(row[h]) : '';
        return `"${val.replace(/"/g, '""')}"`;
      });
      csvRows.push(values.join(','));
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Tiruppur_Weekly_Status_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
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
              <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-stone-700" />
                <span>Weekly Production Status Export</span>
              </h1>
              <InfoButton
                align="left"
                title="Weekly Status Export"
                content={
                  <div className="space-y-1 text-stone-600">
                    <p>Certified weekly progress summary per buyer account with daily run-rate delay metrics, ex-factory dates, and health statuses.</p>
                  </div>
                }
              />
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Certified export status summary per buyer account with daily run-rate delay metrics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 border border-stone-200"
          >
            <Download className="w-4 h-4 text-stone-600" />
            <span>Download CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-[#1e2633] hover:bg-[#2c3749] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet View */}
      <div className="bg-white p-4 sm:p-7 rounded-2xl border border-stone-200 shadow-xs space-y-5">
        {/* Printable Header */}
        <div className="border-b border-stone-200 pb-4 flex justify-between items-start flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg sm:text-xl text-stone-900">Company A Knitwear Exporters</span>
              <span className="text-[10px] font-mono bg-stone-100 px-2 py-0.5 rounded text-stone-600 border border-stone-200">
                Tiruppur, India
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">Weekly Order Milestone & Output Run-Rate Status Report</p>
          </div>
          <div className="text-left sm:text-right text-xs text-stone-500">
            <div>Generated: <strong className="text-stone-900 font-mono">{report?.generated_at || '2026-11-09'}</strong></div>
            <div>Total Orders: <strong className="text-stone-900 font-mono">{report?.total_orders || 0}</strong></div>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-600 mb-2" />
            <p className="text-xs font-semibold text-stone-600">Generating export report...</p>
          </div>
        ) : !report || !report.data || report.data.length === 0 ? (
          <p className="text-xs text-stone-500 italic py-4">No order records found for this export filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-stone-200 text-stone-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="pb-2.5">PO No</th>
                  <th className="pb-2.5">Buyer</th>
                  <th className="pb-2.5">Style & Color</th>
                  <th className="pb-2.5 text-right">Order Qty</th>
                  <th className="pb-2.5">Stage</th>
                  <th className="pb-2.5 text-right">Qty Done</th>
                  <th className="pb-2.5 text-right">Ex-Factory</th>
                  <th className="pb-2.5">Run Rate</th>
                  <th className="pb-2.5">Projected</th>
                  <th className="pb-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {report.data.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-stone-50/60">
                    <td className="py-2.5 font-mono font-bold text-stone-900">{row['PO Number']}</td>
                    <td className="py-2.5 font-medium text-stone-800">{row['Buyer']}</td>
                    <td className="py-2.5 text-stone-700">
                      <div>{row['Style']}</div>
                      <div className="text-[10px] text-stone-400">{row['Color']}</div>
                    </td>
                    <td className="py-2.5 font-mono text-right font-medium">{row['Total Qty']?.toLocaleString()}</td>
                    <td className="py-2.5 font-medium text-stone-800">{row['Current Stage']}</td>
                    <td className="py-2.5 font-mono text-right font-bold text-emerald-800">
                      {row['Qty Done']?.toLocaleString()} ({row['Progress']})
                    </td>
                    <td className="py-2.5 font-mono text-right text-stone-800">{row['Ex-Factory Date']}</td>
                    <td className="py-2.5 font-mono text-stone-700">{row['Daily Run Rate']}</td>
                    <td className="py-2.5 font-mono text-stone-800">
                      {row['Projected Finish']}
                      {row['Delay (Days)'] > 0 && (
                        <span className="text-rose-700 font-bold ml-1">
                          (+{row['Delay (Days)']}d)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <StatusBadge status={row['Status']} delayDays={row['Delay (Days)']} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-stone-200 pt-3 text-[11px] text-stone-400 flex justify-between items-center">
          <div>TiruppurTex Production Engine • Confidential buyer export report</div>
          <div>Page 1 of 1</div>
        </div>
      </div>
    </div>
  );
};

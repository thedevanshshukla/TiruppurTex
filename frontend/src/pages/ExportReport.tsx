import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
              <span>Weekly Production Status Export</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Certified export status summary per buyer account with daily run-rate delay metrics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCsv}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Download Excel / CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Sheet View */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        {/* Printable Header */}
        <div className="border-b border-slate-200 pb-5 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl text-slate-900">Company A Knitwear Exporters</span>
              <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200">
                Tiruppur, India
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Weekly Order Milestone & Output Run-Rate Status Report</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <div>Report Date: <strong className="text-slate-900">{report?.generated_at || '2026-11-06'}</strong></div>
            <div>Total Export Orders: <strong className="text-slate-900">{report?.total_orders || 0}</strong></div>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
            <p className="text-xs font-semibold text-slate-600">Generating export report...</p>
          </div>
        ) : !report || !report.data || report.data.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4">No order records found for this export filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b-2 border-slate-300 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="pb-3">PO No</th>
                  <th className="pb-3">Buyer</th>
                  <th className="pb-3">Style & Color</th>
                  <th className="pb-3 text-right">Order Qty</th>
                  <th className="pb-3">Stage</th>
                  <th className="pb-3 text-right">Qty Done</th>
                  <th className="pb-3 text-right">Ex-Factory</th>
                  <th className="pb-3">Daily Run Rate</th>
                  <th className="pb-3">Projected Finish</th>
                  <th className="pb-3">Health Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.data.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-3 font-mono font-bold text-slate-900">{row['PO Number']}</td>
                    <td className="py-3 font-semibold text-slate-800">{row['Buyer']}</td>
                    <td className="py-3 text-slate-700">
                      <div>{row['Style']}</div>
                      <div className="text-[10px] text-slate-400">{row['Color']}</div>
                    </td>
                    <td className="py-3 font-mono text-right font-medium">{row['Total Qty']?.toLocaleString()}</td>
                    <td className="py-3 font-medium text-indigo-700">{row['Current Stage']}</td>
                    <td className="py-3 font-mono text-right font-bold text-emerald-700">
                      {row['Qty Done']?.toLocaleString()} ({row['Progress']})
                    </td>
                    <td className="py-3 font-mono text-right text-slate-800">{row['Ex-Factory Date']}</td>
                    <td className="py-3 font-mono text-slate-700">{row['Daily Run Rate']}</td>
                    <td className="py-3 font-mono text-slate-800">
                      {row['Projected Finish']}
                      {row['Delay (Days)'] > 0 && (
                        <span className="text-rose-600 font-bold ml-1">
                          (+{row['Delay (Days)']}d)
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={row['Status']} delayDays={row['Delay (Days)']} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-slate-200 pt-4 text-[11px] text-slate-400 flex justify-between items-center">
          <div>TiruppurTex Automated Export Feed • Confidential buyer data protection active</div>
          <div>Page 1 of 1</div>
        </div>
      </div>
    </div>
  );
};


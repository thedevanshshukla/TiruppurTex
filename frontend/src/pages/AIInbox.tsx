import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { 
  Bot, 
  Check, 
  Edit3, 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  Languages, 
  ShieldCheck, 
  RefreshCw,
  Loader2,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface IssueNote {
  _id: string;
  order_id: string;
  po_number: string;
  supervisor_name: string;
  stage_name: string;
  original_note_tamil: string;
  english_translation: string;
  ai_category: string;
  confidence_score: number;
  urgency: string;
  recommended_action: string;
  merchandiser_override_category: string | null;
  merchandiser_notes: string | null;
  merchandiser_approved_for_buyer: boolean;
  buyer_disclosed_at: string | null;
  status: string;
  created_at: string;
}

export const AIInbox: React.FC = () => {
  const [issues, setIssues] = useState<IssueNote[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const [iRes, cRes] = await Promise.all([
        apiClient.get('/ai/issues'),
        apiClient.get('/ai/categories'),
      ]);
      setIssues(iRes.data);
      setCategories(cRes.data);
    } catch (err) {
      console.error('Failed to load issues', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleUpdateCategory = async (issueId: string, newCategory: string) => {
    setSavingId(issueId);
    try {
      const res = await apiClient.patch(`/ai/issues/${issueId}`, {
        merchandiser_override_category: newCategory,
        status: 'VERIFIED',
      });
      setIssues((prev) =>
        prev.map((i) => (i._id === issueId ? res.data.issue : i))
      );
      setSavedBanner('Category override saved successfully');
      setTimeout(() => setSavedBanner(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleBuyerApproval = async (issueId: string, currentApproved: boolean) => {
    setSavingId(issueId);
    try {
      const res = await apiClient.patch(`/ai/issues/${issueId}`, {
        merchandiser_approved_for_buyer: !currentApproved,
      });
      setIssues((prev) =>
        prev.map((i) => (i._id === issueId ? res.data.issue : i))
      );
      setSavedBanner(
        !currentApproved
          ? 'Delay notice approved & published to Buyer Portal'
          : 'Delay notice hidden from Buyer Portal'
      );
      setTimeout(() => setSavedBanner(null), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Bot className="w-6 h-6 text-indigo-600" />
            <span>AI Tamil Floor Issue Triage</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Side-by-side translation verification, reason categorization & buyer disclosure gating
          </p>
        </div>

        <button
          onClick={fetchIssues}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors self-start"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Explanation Banner */}
      <div className="p-4 bg-indigo-50/60 border border-indigo-200/80 rounded-2xl flex items-start gap-3 text-xs text-indigo-950">
        <Languages className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>Human-in-the-Loop Safeguard:</strong> Supervisors report issues in Tamil text or voice notes. The AI translates the note and suggests a reason category. If the AI is wrong, you can override the category below. 
          <span className="block mt-1 font-semibold text-rose-800">
            ⚠️ Per export policy: Delay warnings are NEVER shown to buyers until you explicitly toggle "Notify Buyer".
          </span>
        </div>
      </div>

      {savedBanner && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{savedBanner}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
          <p className="text-xs font-semibold text-slate-600">Loading AI triage inbox...</p>
        </div>
      ) : issues.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800">Inbox Zero: No floor issues pending review</p>
          <p className="text-xs text-slate-500 mt-1">All supervisor notes have been triaged.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => {
            const confidencePct = Math.round(issue.confidence_score * 100);
            const activeCategory = issue.merchandiser_override_category || issue.ai_category;

            return (
              <div
                key={issue._id}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4"
              >
                {/* Header: PO & Confidence Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-extrabold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                      {issue.po_number}
                    </span>
                    <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                      {issue.stage_name}
                    </span>
                    <span className="text-xs text-slate-500">
                      by <strong>{issue.supervisor_name}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      confidencePct >= 85
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      AI Confidence: {confidencePct}%
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(issue.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Side-by-Side: Original Tamil Note vs English AI Translation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Original Tamil Floor Note */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <span>அசல் தமிழ் குறிப்பு (Original Tamil Note)</span>
                    </div>
                    <div className="text-sm font-medium text-slate-900 font-tamil leading-relaxed">
                      "{issue.original_note_tamil}"
                    </div>
                  </div>

                  {/* Right: English Translation */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <span>AI Verified English Translation</span>
                    </div>
                    <div className="text-sm font-medium text-slate-800 leading-relaxed italic">
                      "{issue.english_translation}"
                    </div>
                  </div>
                </div>

                {/* AI Classification & Override Controls */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="text-xs font-bold text-slate-700">
                      Reason Category:
                    </label>
                    <select
                      value={activeCategory}
                      onChange={(e) => handleUpdateCategory(issue._id, e.target.value)}
                      disabled={savingId === issue._id}
                      className="px-3 py-1.5 bg-white text-slate-900 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>

                    {issue.merchandiser_override_category && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                        Overridden by Merchandiser
                      </span>
                    )}
                  </div>

                  {/* Buyer Notification Gate */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1 justify-end">
                        <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Buyer Visibility Gate</span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {issue.merchandiser_approved_for_buyer
                          ? 'Visible in Buyer Portal'
                          : 'Internal Only (Hidden from Buyer)'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleBuyerApproval(issue._id, issue.merchandiser_approved_for_buyer)}
                      disabled={savingId === issue._id}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        issue.merchandiser_approved_for_buyer
                          ? 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-700'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {issue.merchandiser_approved_for_buyer ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Notified to Buyer</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                          <span>Approve for Buyer</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};


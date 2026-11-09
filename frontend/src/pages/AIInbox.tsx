import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { InfoButton } from '../components/InfoButton';
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
  Clock,
  Mic,
  Volume2
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
  is_voice?: boolean;
  audio_url?: string;
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
    <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-5">
      {/* Title & Instructions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <Bot className="w-5 h-5 text-stone-700" />
            <span>AI Floor Issue Triage</span>
          </h1>
          <InfoButton
            align="left"
            title="How AI Triage & Safeguards Work"
            content={
              <div className="space-y-1.5 text-stone-600">
                <p><strong>Bilingual Voice & Text Pipeline:</strong> Supervisors log factory delays in Tamil. The AI translates the note and classifies the root cause into standardized export categories.</p>
                <p><strong>Human-in-the-Loop Override:</strong> If the model miscategorizes a floor issue, you can override the category dropdown at any time.</p>
                <p className="text-amber-800 font-medium"><strong>Buyer Privacy Gate:</strong> Delay notices remain strictly internal until you explicitly click "Approve for Buyer".</p>
              </div>
            }
          />
        </div>

        <button
          type="button"
          onClick={fetchIssues}
          className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl border border-stone-200 transition-colors self-start sm:self-auto"
          title="Refresh floor issues"
          aria-label="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {savedBanner && (
        <div className="p-3 bg-emerald-50/80 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedBanner}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-600 mb-2" />
          <p className="text-xs font-semibold text-stone-600">Loading AI triage inbox...</p>
        </div>
      ) : issues.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
          <p className="text-sm font-bold text-stone-800">Inbox Zero: No floor issues pending review</p>
          <p className="text-xs text-stone-500">All supervisor notes have been triaged and verified.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => {
            const confidencePct = Math.round(issue.confidence_score * 100);
            const activeCategory = issue.merchandiser_override_category || issue.ai_category;

            return (
              <div
                key={issue._id}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200 shadow-xs space-y-3.5"
              >
                {/* Header: PO, Stage & Confidence Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-mono text-xs font-bold text-stone-900 bg-stone-100 px-2.5 py-0.5 rounded border border-stone-200">
                      {issue.po_number}
                    </span>
                    <span className="text-xs font-semibold text-stone-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                      {issue.stage_name}
                    </span>
                    <span className="text-xs text-stone-500">
                      by <strong className="text-stone-700">{issue.supervisor_name}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {issue.is_voice && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                        <Mic className="w-3 h-3 text-purple-600" />
                        Voice Note
                      </span>
                    )}
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                      confidencePct >= 85
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      AI Match: {confidencePct}%
                    </span>
                    <span className="text-[11px] text-stone-400 font-mono">
                      {new Date(issue.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Side-by-Side: Original Tamil Note vs English AI Translation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Left: Original Tamil Floor Note */}
                  <div className="bg-stone-50/70 p-3.5 rounded-xl border border-stone-200">
                    <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                      அசல் தமிழ் குறிப்பு (Original Tamil Note)
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-stone-900 leading-relaxed font-tamil">
                      "{issue.original_note_tamil}"
                    </div>
                  </div>

                  {/* Right: English Translation */}
                  <div className="bg-stone-50/70 p-3.5 rounded-xl border border-stone-200">
                    <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                      AI Verified English Translation
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-stone-800 leading-relaxed italic">
                      "{issue.english_translation}"
                    </div>
                  </div>
                </div>

                {/* Optional Floor Voice Audio Playback */}
                {issue.audio_url && (
                  <div className="p-2.5 bg-stone-50/80 rounded-xl border border-stone-200 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-stone-700">
                      <Volume2 className="w-3.5 h-3.5 text-purple-600" />
                      <span>Floor Supervisor Voice Recording:</span>
                    </div>
                    <audio controls src={issue.audio_url} className="w-full h-8 rounded" />
                  </div>
                )}

                {/* AI Classification & Override Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-100">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <label className="text-xs font-bold text-stone-700">
                      Reason Category:
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={activeCategory}
                        onChange={(e) => handleUpdateCategory(issue._id, e.target.value)}
                        disabled={savingId === issue._id}
                        className="px-3 py-1.5 bg-white text-stone-900 border border-stone-300 rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>

                      {issue.merchandiser_override_category && (
                        <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                          Overridden
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Buyer Notification Gate */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-1 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <div className="text-xs font-bold text-stone-800 flex items-center gap-1 sm:justify-end">
                        <ShieldCheck className="w-3.5 h-3.5 text-stone-600" />
                        <span>Buyer Visibility</span>
                      </div>
                      <div className="text-[10px] text-stone-500">
                        {issue.merchandiser_approved_for_buyer
                          ? 'Visible in Buyer Portal'
                          : 'Internal Only'}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleBuyerApproval(issue._id, issue.merchandiser_approved_for_buyer)}
                      disabled={savingId === issue._id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        issue.merchandiser_approved_for_buyer
                          ? 'bg-emerald-700 text-white shadow-xs hover:bg-emerald-800'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300'
                      }`}
                    >
                      {issue.merchandiser_approved_for_buyer ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Notified</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-stone-400" />
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

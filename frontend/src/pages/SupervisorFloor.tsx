import React, { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { 
  enqueueDailyLog, 
  getQueuedLogs, 
  processOfflineQueue, 
  isOnline 
} from '../utils/offlineQueue';
import { 
  Camera, 
  Mic, 
  MicOff, 
  Send, 
  Wifi, 
  WifiOff, 
  Languages, 
  CheckCircle2, 
  Loader2, 
  AlertTriangle,
  UploadCloud,
  Layers,
  Sparkles
} from 'lucide-react';

export const SupervisorFloor: React.FC = () => {
  const { user } = useAuth();
  const [lang, setLang] = useState<'ta' | 'en'>(user?.language_preference === 'ta' ? 'ta' : 'ta');
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Form states
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [selectedStage, setSelectedStage] = useState('Stitching');
  const [quantity, setQuantity] = useState('');
  const [defectCount, setDefectCount] = useState('0');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [issueNote, setIssueNote] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  
  // Submission & Offline state
  const [submitting, setSubmitting] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [queueCount, setQueueCount] = useState(0);
  const [syncingQueue, setSyncingQueue] = useState(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Stages
  const stages = [
    { id: 'Fabric Sourcing & Dyeing', ta: 'நூல் & துணி சாயமிடுதல்', en: 'Fabric Sourcing & Dyeing' },
    { id: 'Cutting', ta: 'கட்டிங் (வெட்டுதல்)', en: 'Cutting' },
    { id: 'Printing / Embroidery', ta: 'பிரிண்டிங் / எம்ப்ராய்டரி', en: 'Printing / Embroidery' },
    { id: 'Stitching', ta: 'தையல் பிரிவு (Stitching)', en: 'Stitching' },
    { id: 'Washing', ta: 'சலவை (Washing)', en: 'Washing' },
    { id: 'Finishing & Ironing', ta: 'அயர்னிங் & ஃபினிஷிங்', en: 'Finishing & Ironing' },
    { id: 'Final Inspection & Packing', ta: 'பேக்கிங் & இன்ஸ்பெக்ஷன்', en: 'Packing & Final QC' },
  ];

  // Common Tamil Quick Floor Notes (Tiruppur shop floor dialect)
  const quickTamilNotes = [
    'தையல் மெஷின் மோட்டார் பழுதாகிவிட்டது, 3 மணி நேரம் வேலை நின்றது',
    'நூல் வரத்து தாமதமாகிவிட்டது, டையிங் லாட் வரவில்லை',
    'பிரிண்டிங் மை கசிவு காரணமாக 350 துணிகள் மறுவேலை செய்ய வேண்டும்',
    'இன்று 5 தையல் கலைஞர்கள் விடுப்பு, ஆட்கள் பற்றாக்குறை',
    'எல்லாம் திட்டமிட்டபடி சீராக செல்கிறது',
  ];

  useEffect(() => {
    // Monitor online/offline status
    setOnlineStatus(isOnline());
    setQueueCount(getQueuedLogs().length);

    const handleOnline = () => {
      setOnlineStatus(true);
      autoSync();
    };
    const handleOffline = () => {
      setOnlineStatus(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Fetch assigned orders for this supervisor
    apiClient.get('/supervisor/assigned-orders')
      .then((res) => {
        setOrders(res.data);
        if (res.data.length > 0) {
          setSelectedOrderId(res.data[0]._id);
          setSelectedStage(res.data[0].current_stage || 'Stitching');
        }
      })
      .catch((e) => console.error('Failed to load supervisor orders', e))
      .finally(() => setLoadingOrders(false));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const autoSync = async () => {
    if (getQueuedLogs().length === 0) return;
    setSyncingQueue(true);
    try {
      const res = await processOfflineQueue();
      setQueueCount(getQueuedLogs().length);
      if (res.synced > 0) {
        setSuccessBanner(
          lang === 'ta'
            ? `நெட்வொர்க் கிடைத்தது! ${res.synced} ஆஃப்லைன் பதிவுகள் வெற்றிகரமாக அனுப்பப்பட்டன.`
            : `Network reconnected! Synced ${res.synced} queued updates.`
        );
      }
    } finally {
      setSyncingQueue(false);
    }
  };

  // Photo upload handler
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Voice Recording simulation / Web Speech API
  const handleToggleVoice = () => {
    if (!isRecording) {
      setIsRecording(true);
      // Simulate live Tamil voice capture
      setTimeout(() => {
        setIssueNote('தையல் மெஷின் மோட்டார் பழுதாகிவிட்டது, 3 மணி நேரம் வேலை நின்றது');
        setIsRecording(false);
      }, 2000);
    } else {
      setIsRecording(false);
    }
  };

  // Submit floor entry
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = parseInt(quantity, 10);
    if (!qtyNum || qtyNum <= 0) {
      alert(lang === 'ta' ? 'தயவுசெய்து சரியான எண்ணிக்கையை உள்ளிடவும்' : 'Please enter valid quantity');
      return;
    }

    const selectedOrder = orders.find((o) => o._id === selectedOrderId);
    const poNum = selectedOrder?.po_number || 'PO';

    setSubmitting(true);
    setSuccessBanner(null);

    // If Offline: Queue in IndexedDB/localStorage
    if (!isOnline() || !onlineStatus) {
      enqueueDailyLog({
        order_id: selectedOrderId,
        po_number: poNum,
        stage_name: selectedStage,
        quantity_produced: qtyNum,
        defect_count: parseInt(defectCount, 10) || 0,
        photo_url: photoPreview || undefined,
        issue_note_tamil: issueNote.trim() || undefined,
        is_voice: false,
      });
      setQueueCount(getQueuedLogs().length);
      setQuantity('');
      setPhotoPreview(null);
      setIssueNote('');
      setSubmitting(false);
      setSuccessBanner(
        lang === 'ta'
          ? 'இணைப்பு இல்லை: உங்கள் பதிவு போனில் பாதுகாப்பாக வைக்கப்பட்டது. நெட்வொர்க் வந்ததும் தானாக அனுப்பப்படும்!'
          : 'Offline Mode: Update saved locally on your phone. Will auto-sync when network returns!'
      );
      return;
    }

    // If Online: Post to API
    try {
      const res = await apiClient.post('/supervisor/daily-log', {
        order_id: selectedOrderId,
        stage_name: selectedStage,
        quantity_produced: qtyNum,
        defect_count: parseInt(defectCount, 10) || 0,
        photo_url: photoPreview,
        issue_note_tamil: issueNote.trim(),
        is_voice: false,
      });

      setSuccessBanner(
        lang === 'ta'
          ? `வெற்றிகரமாக பதிவு செய்யப்பட்டது! மொத்த எண்ணிக்கை: ${res.data.completed_quantity} ஆடைகள்.`
          : `Floor update submitted! Total completed: ${res.data.completed_quantity} pcs.`
      );
      setQuantity('');
      setDefectCount('0');
      setPhotoPreview(null);
      setIssueNote('');
    } catch (err: any) {
      // Fallback to queue if API failed unexpectedly
      enqueueDailyLog({
        order_id: selectedOrderId,
        po_number: poNum,
        stage_name: selectedStage,
        quantity_produced: qtyNum,
        defect_count: parseInt(defectCount, 10) || 0,
        photo_url: photoPreview || undefined,
        issue_note_tamil: issueNote.trim() || undefined,
      });
      setQueueCount(getQueuedLogs().length);
      setSuccessBanner(
        lang === 'ta'
          ? 'சர்வர் பிழை: பதிவு பாதுகாப்பாக போனில் சேமிக்கப்பட்டது.'
          : 'Server unreachable: update safely queued on device.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-4">
      {/* Top Mobile Bar: Language Toggle & Network Status */}
      <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          {onlineStatus ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'ta' ? 'ஆன்லைன்' : 'Online'}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 animate-pulse">
              <WifiOff className="w-3.5 h-3.5 text-rose-600" />
              <span>{lang === 'ta' ? 'ஆஃப்லைன் முறை' : 'Offline Mode'}</span>
            </span>
          )}

          {queueCount > 0 && (
            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {queueCount} {lang === 'ta' ? 'காத்திருப்பு' : 'Queued'}
            </span>
          )}
        </div>

        {/* Bilingual Toggle Button */}
        <button
          onClick={() => setLang(lang === 'ta' ? 'en' : 'ta')}
          className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-800 transition-colors"
        >
          <Languages className="w-3.5 h-3.5 text-indigo-600" />
          <span>{lang === 'ta' ? 'English' : 'தமிழ்'}</span>
        </button>
      </div>

      {/* Offline Sync Banner if pending items */}
      {queueCount > 0 && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-800">
          <div>
            <div className="font-bold">
              {lang === 'ta' ? 'போனில் சேமிக்கப்பட்ட பதிவுகள்' : 'Offline logs queued on phone'}
            </div>
            <div className="text-[11px] text-amber-700">
              {queueCount} {lang === 'ta' ? 'பதிவுகள் அனுப்ப தயாராக உள்ளன' : 'updates pending network sync'}
            </div>
          </div>
          <button
            onClick={autoSync}
            disabled={syncingQueue}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1"
          >
            {syncingQueue && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{lang === 'ta' ? 'இப்போதே அனுப்பு' : 'Sync Now'}</span>
          </button>
        </div>
      )}

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-start gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Main Floor Entry Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>{lang === 'ta' ? 'தினசரி உற்பத்தி பதிவு' : 'Daily Floor Production Update'}</span>
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {lang === 'ta'
              ? 'தயாரித்த ஆடைகளின் எண்ணிக்கை, புகைப்படம் மற்றும் குறிப்பை உள்ளிடவும்'
              : 'Enter today good pieces, inspection photo and floor issue note'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. PO Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {lang === 'ta' ? 'ஆர்டர் எண் (PO Selection)' : 'Select PO Number'} *
            </label>
            <select
              required
              value={selectedOrderId}
              onChange={(e) => {
                setSelectedOrderId(e.target.value);
                const o = orders.find((ord) => ord._id === e.target.value);
                if (o?.current_stage) setSelectedStage(o.current_stage);
              }}
              className="w-full px-3.5 py-3 bg-slate-50 text-slate-900 rounded-xl text-sm font-bold border border-slate-300 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {orders.map((o) => (
                <option key={o._id} value={o._id}>
                  {o.po_number} — {o.style_name} ({o.buyer_name})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Stage Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {lang === 'ta' ? 'உற்பத்தி நிலை (Stage)' : 'Production Stage'} *
            </label>
            <select
              required
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="w-full px-3.5 py-3 bg-slate-50 text-slate-900 rounded-xl text-xs font-semibold border border-slate-300 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {stages.map((st) => (
                <option key={st.id} value={st.id}>
                  {lang === 'ta' ? st.ta : st.en}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Daily Good Pieces Count - High Visibility Touch Target */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {lang === 'ta' ? 'இன்று முடித்த நல்ல ஆடைகள் (Pieces Made)' : 'Today Good Output (Pieces)'} *
            </label>
            <input
              type="number"
              inputMode="numeric"
              required
              placeholder="e.g. 450"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-4 py-3.5 bg-slate-50 text-slate-900 rounded-xl text-xl font-mono font-black border-2 border-indigo-200 focus:border-indigo-600 focus:bg-white focus:outline-hidden"
            />
          </div>

          {/* 4. Defect Count */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {lang === 'ta' ? 'பழுதான / நீக்கப்பட்ட ஆடைகள் (Defects)' : 'Quarantined Defects (Pieces)'}
            </label>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              value={defectCount}
              onChange={(e) => setDefectCount(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 text-slate-900 rounded-xl text-sm font-mono font-bold border border-slate-300 focus:bg-white focus:outline-hidden"
            />
          </div>

          {/* 5. Photo Upload / Camera Proof */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>{lang === 'ta' ? 'ஆய்வு புகைப்படம் (Floor Photo)' : 'Floor Inspection Photo'}</span>
              <span className="text-[10px] text-slate-400 font-normal">{lang === 'ta' ? 'ஆப்ஷனல்' : 'Optional'}</span>
            </label>
            
            {photoPreview ? (
              <div className="relative rounded-xl overflow-hidden border border-slate-200">
                <img src={photoPreview} alt="Inspection Proof" className="w-full h-36 object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="absolute top-2 right-2 px-2 py-1 bg-slate-900/80 text-white text-[11px] font-bold rounded-lg"
                >
                  {lang === 'ta' ? 'நீக்கு' : 'Remove'}
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="w-full flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer text-slate-600 text-xs font-bold transition-colors">
                  <Camera className="w-4 h-4 text-indigo-600" />
                  <span>{lang === 'ta' ? 'கேமரா / கேலரி படம் சேர்க்க' : 'Take Photo / Upload Proof'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    // High-resolution SVG data URI representing a stitched garment inspection bundle
                    const sampleSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250"><rect width="100%" height="100%" fill="%231e293b"/><rect x="20" y="20" width="360" height="210" rx="12" fill="%23334155"/><path d="M120 70 L280 70 L320 110 L280 130 L280 200 L120 200 L120 130 L80 110 Z" fill="%234338ca" stroke="%23818cf8" stroke-width="3"/><circle cx="200" cy="70" r="25" fill="%23334155" stroke="%23818cf8" stroke-width="2"/><text x="200" y="155" font-family="sans-serif" font-size="12" font-weight="bold" fill="white" text-anchor="middle">INSPECTION BATCH OK</text><text x="200" y="175" font-family="sans-serif" font-size="10" fill="%2394a3b8" text-anchor="middle">Line 4 Quality Passed</text></svg>`;
                    setPhotoPreview(sampleSvg);
                  }}
                  className="w-full text-center text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold py-1 bg-indigo-50/60 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-200/50"
                >
                  ⚡ {lang === 'ta' ? 'மாதிரி ஆய்வு படத்தை இணைக்க (1-Click Sample Photo)' : 'Attach 1-Click Demo Inspection Photo'}
                </button>
              </div>
            )}
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
              </label>
            )}
          </div>

          {/* 6. Issue Note by Text or Voice (Tamil) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>{lang === 'ta' ? 'பிரச்சனை / குறிப்பு (Voice or Text)' : 'Issue Note (Tamil/English)'}</span>
              </label>

              {/* Voice Note Button */}
              <button
                type="button"
                onClick={handleToggleVoice}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                }`}
              >
                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span>{isRecording ? (lang === 'ta' ? 'பதிவாகிறது...' : 'Listening...') : (lang === 'ta' ? 'குரல் பதிவு' : 'Voice Note')}</span>
              </button>
            </div>

            <textarea
              rows={2}
              placeholder={
                lang === 'ta'
                  ? 'எ.கா: தையல் மெஷின் மோட்டார் பழுதாகிவிட்டது, 3 மணி நேரம் வேலை நின்றது...'
                  : 'e.g. Stitching machine motor broke down, work halted for 3 hours...'
              }
              value={issueNote}
              onChange={(e) => setIssueNote(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 text-slate-900 rounded-xl text-xs border border-slate-300 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
            />

            {/* Quick Tamil phrases buttons for fast floor entry */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {quickTamilNotes.map((note, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIssueNote(note)}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-medium shrink-0 max-w-[200px] truncate"
                >
                  {note}
                </button>
              ))}
            </div>
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>
              {onlineStatus
                ? lang === 'ta'
                  ? 'அனுப்பு (Send Floor Update)'
                  : 'Send Floor Update'
                : lang === 'ta'
                ? 'போனில் சேமி (Save Offline)'
                : 'Save to Offline Queue'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};


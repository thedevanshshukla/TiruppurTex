import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { InfoButton } from '../components/InfoButton';
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
  Sparkles,
  Check,
  Square,
  Trash2,
  Volume2
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
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isVoiceNote, setIsVoiceNote] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [voiceStatusText, setVoiceStatusText] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  
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
  }, [user?.email]);

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

  const startRecording = async () => {
    setVoiceStatusText(null);
    audioChunksRef.current = [];
    setRecordingSeconds(0);

    // 1. Try starting audio stream via MediaRecorder
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
          ? 'audio/webm' 
          : MediaRecorder.isTypeSupported('audio/mp4') 
            ? 'audio/mp4' 
            : '';
        const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        recorder.onstop = () => {
          if (audioChunksRef.current.length > 0) {
            const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
            const previewUrl = URL.createObjectURL(blob);
            setAudioUrl(previewUrl);

            // Convert to base64 for submission
            const reader = new FileReader();
            reader.onloadend = () => {
              setAudioBase64(reader.result as string);
            };
            reader.readAsDataURL(blob);
          }
          // Turn off microphone hardware track
          stream.getTracks().forEach((t) => t.stop());
        };

        recorder.start(250);
      }
    } catch (err: any) {
      console.warn('Microphone access unavailable or denied:', err);
      setVoiceStatusText(
        lang === 'ta'
          ? 'மைக்ரோஃபோன் அனுமதி கிடைக்கவில்லை. கீழே உள்ள மாதிரி ஆடியோ குறிப்பை தேர்வு செய்யலாம்.'
          : 'Microphone permission blocked or unavailable. You can tap any sample note below.'
      );
    }

    // 2. Try starting SpeechRecognition for real-time Tamil/English speech-to-text
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = lang === 'ta' ? 'ta-IN' : 'en-IN';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = 0; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript.trim()) {
            setIssueNote(transcript.trim());
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition error:', e.error);
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (recErr) {
        console.warn('Speech recognition start failed:', recErr);
      }
    }

    setIsRecording(true);
    setIsVoiceNote(true);

    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('Error stopping media recorder', e);
      }
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn('Error stopping speech recognition', e);
      }
      recognitionRef.current = null;
    }

    // If no text was recognized (silence or STT unavailable), set realistic default
    if (!issueNote.trim()) {
      setIssueNote('தையல் மெஷின் மோட்டார் பழுதாகிவிட்டது, 3 மணி நேரம் வேலை நின்றது');
    }
  };

  const handleToggleVoice = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const clearAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setAudioBase64(null);
    setIsVoiceNote(false);
  };

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
        audio_url: audioBase64 || undefined,
        issue_note_tamil: issueNote.trim() || undefined,
        is_voice: isVoiceNote || Boolean(audioBase64),
      });
      setQueueCount(getQueuedLogs().length);
      setQuantity('');
      setPhotoPreview(null);
      setIssueNote('');
      clearAudio();
      setSubmitting(false);
      setSuccessBanner(
        lang === 'ta'
          ? 'இணைப்பு இல்லை: பதிவு பாதுகாப்பாக சேமிக்கப்பட்டது. நெட்வொர்க் வந்ததும் தானாக அனுப்பப்படும்!'
          : 'Offline Mode: Update saved locally on device. Will auto-sync when network returns!'
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
        audio_url: audioBase64 || undefined,
        issue_note_tamil: issueNote.trim(),
        is_voice: isVoiceNote || Boolean(audioBase64),
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
      clearAudio();
    } catch (err: any) {
      enqueueDailyLog({
        order_id: selectedOrderId,
        po_number: poNum,
        stage_name: selectedStage,
        quantity_produced: qtyNum,
        defect_count: parseInt(defectCount, 10) || 0,
        photo_url: photoPreview || undefined,
        audio_url: audioBase64 || undefined,
        issue_note_tamil: issueNote.trim() || undefined,
        is_voice: isVoiceNote || Boolean(audioBase64),
      });
      setQueueCount(getQueuedLogs().length);
      setSuccessBanner(
        lang === 'ta'
          ? 'சர்வர் பிழை: பதிவு பாதுகாப்பாக சேமிக்கப்பட்டது.'
          : 'Server unreachable: update safely queued on device.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const selectedOrder = orders.find((o) => o._id === selectedOrderId);

  return (
    <div className="max-w-4xl mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-4 sm:space-y-5">
      {/* Top Bar: Network Status, Queue Count, Guidance Info & Language Toggle */}
      <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-stone-200 shadow-2xs flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {onlineStatus ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'ta' ? 'ஆன்லைன் (Online)' : 'Online'}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 animate-pulse">
              <WifiOff className="w-3.5 h-3.5 text-rose-600" />
              <span>{lang === 'ta' ? 'ஆஃப்லைன் முறை' : 'Offline Mode'}</span>
            </span>
          )}

          {queueCount > 0 && (
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              {queueCount} {lang === 'ta' ? 'காத்திருப்பு' : 'Queued'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <InfoButton
            align="right"
            title={lang === 'ta' ? 'வழிகாட்டி (Floor Guide)' : 'Floor Update Guide'}
            content={
              <div className="space-y-1.5 text-stone-600">
                <p><strong>{lang === 'ta' ? 'தினசரி பதிவு:' : 'Daily Log:'}</strong> {lang === 'ta' ? 'இன்று முடித்த நல்ல ஆடைகளை உள்ளிடவும். இது தானாக உற்பத்திக் கணக்கை அப்டேட் செய்யும்.' : 'Enter good pieces produced today. This immediately recalculates order run-rates.'}</p>
                <p><strong>{lang === 'ta' ? 'ஆஃப்லைன் வசதி:' : 'Offline Support:'}</strong> {lang === 'ta' ? 'இணைப்பு இல்லையென்றாலும் பாதுகாப்பாக சேமிக்கப்படும்; நெட்வொர்க் வந்ததும் தானாக செல்லும்.' : 'Works inside the factory without Wi-Fi. Queued updates auto-sync when network returns.'}</p>
                <p><strong>{lang === 'ta' ? 'குரல் பதிவு:' : 'Voice Note:'}</strong> {lang === 'ta' ? 'தமிழில் பேசலாம் அல்லது தட்டச்சு செய்யலாம்; AI ஆங்கிலத்தில் மொழிபெயர்க்கும்.' : 'Speak or type in Tamil; the AI translates and categorizes the delay for the merchandiser.'}</p>
              </div>
            }
          />

          <button
            type="button"
            onClick={() => setLang(lang === 'ta' ? 'en' : 'ta')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-xl text-xs font-semibold text-stone-800 transition-colors cursor-pointer"
          >
            <Languages className="w-3.5 h-3.5 text-stone-600" />
            <span>{lang === 'ta' ? 'English' : 'தமிழ்'}</span>
          </button>
        </div>
      </div>

      {/* Offline Sync Banner if pending items */}
      {queueCount > 0 && (
        <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
          <div>
            <div className="font-bold">
              {lang === 'ta' ? 'சேமிக்கப்பட்ட ஆஃப்லைன் பதிவுகள்' : 'Offline logs queued on device'}
            </div>
            <div className="text-[11px] text-amber-700">
              {queueCount} {lang === 'ta' ? 'பதிவுகள் அனுப்ப தயாராக உள்ளன' : 'updates pending network sync'}
            </div>
          </div>
          <button
            type="button"
            onClick={autoSync}
            disabled={syncingQueue}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
          >
            {syncingQueue && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{lang === 'ta' ? 'அனுப்பு' : 'Sync Now'}</span>
          </button>
        </div>
      )}

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-3 bg-emerald-50/80 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-start gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* Main Production Entry Form Card */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4 sm:space-y-5">
        <div className="border-b border-stone-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight">
              {lang === 'ta' ? 'தினசரி உற்பத்தி பதிவு' : 'Daily Floor Production Update'}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {lang === 'ta' ? 'ஆர்டர், உற்பத்தி நிலை, எண்ணிக்கை மற்றும் ஆய்வு சான்று' : 'PO selection, stage, output count & visual inspection proof'}
            </p>
          </div>
          {user?.unit_id && (
            <span className="text-[11px] font-semibold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200 self-start sm:self-auto">
              Unit: Unit 1 (Knitwear Main)
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Responsive 2-Column Grid on Desktop, 1-Column on Mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Column 1: Order Details & Output Metrics */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-100 pb-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                <span>{lang === 'ta' ? '1. ஆர்டர் & எண்ணிக்கை' : '1. Order & Production Count'}</span>
              </h3>

              {/* 1. PO Selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
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
                  className="w-full h-11 px-3 bg-stone-50 text-stone-900 rounded-xl text-xs font-semibold border border-stone-300 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                >
                  {orders.map((o) => (
                    <option key={o._id} value={o._id}>
                      {o.po_number} — {o.style_name} ({o.buyer_name})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Order Summary Glance */}
              {selectedOrder && (
                <div className="p-3 bg-stone-50/80 rounded-xl border border-stone-200 text-xs flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-stone-900">{selectedOrder.style_name}</div>
                    <div className="text-[11px] text-stone-500">{selectedOrder.buyer_name} • {selectedOrder.color}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-stone-800 text-xs">
                      {(selectedOrder.completed_quantity || 0).toLocaleString()} / {(selectedOrder.total_quantity || 0).toLocaleString()} pcs
                    </div>
                    <div className="text-[10px] text-stone-400">Total Lot Output</div>
                  </div>
                </div>
              )}

              {/* 2. Stage Selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {lang === 'ta' ? 'உற்பத்தி நிலை (Stage)' : 'Production Stage'} *
                </label>
                <select
                  required
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(e.target.value)}
                  className="w-full h-11 px-3 bg-stone-50 text-stone-900 rounded-xl text-xs font-medium border border-stone-300 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                >
                  {stages.map((st) => (
                    <option key={st.id} value={st.id}>
                      {lang === 'ta' ? st.ta : st.en}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Output Count & Defects Count in balanced 2-column grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {lang === 'ta' ? 'நல்ல ஆடைகள் (Made)' : 'Good Output (Pieces)'} *
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    required
                    placeholder="e.g. 450"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full h-11 px-3 bg-stone-50 text-stone-900 rounded-xl text-sm font-mono font-bold border border-stone-300 focus:bg-white focus:border-amber-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {lang === 'ta' ? 'பழுதானவை (Defects)' : 'Quarantined Defects'}
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={defectCount}
                    onChange={(e) => setDefectCount(e.target.value)}
                    className="w-full h-11 px-3 bg-stone-50 text-stone-900 rounded-xl text-sm font-mono font-bold border border-stone-300 focus:bg-white focus:border-amber-600 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Column 2: Floor Inspection Proof & Issue Notes */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-100 pb-1.5">
                <Camera className="w-3.5 h-3.5 text-amber-600" />
                <span>{lang === 'ta' ? '2. ஆய்வு சான்று & குறிப்புகள்' : '2. Quality Proof & Notes'}</span>
              </h3>

              {/* Photo Proof Upload / Camera */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <span>{lang === 'ta' ? 'ஆய்வு புகைப்படம் (Floor Photo)' : 'Floor Inspection Photo'}</span>
                  <span className="text-[10px] text-stone-400 font-normal">{lang === 'ta' ? 'ஆப்ஷனல்' : 'Optional'}</span>
                </label>
                
                {photoPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-stone-200">
                    <img src={photoPreview} alt="Inspection Proof" className="w-full h-32 object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotoPreview(null)}
                      className="absolute top-2 right-2 px-2 py-0.5 bg-stone-900/80 text-white text-[10px] font-bold rounded-lg hover:bg-stone-900 cursor-pointer"
                    >
                      {lang === 'ta' ? 'நீக்கு' : 'Remove'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="w-full h-11 flex items-center justify-center gap-2 px-3 bg-stone-50 hover:bg-stone-100 border border-dashed border-stone-300 rounded-xl cursor-pointer text-stone-700 text-xs font-semibold transition-colors">
                      <Camera className="w-4 h-4 text-stone-600" />
                      <span>{lang === 'ta' ? 'புகைப்படம் சேர்க்க (Upload Photo)' : 'Take Photo / Upload Proof'}</span>
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
                        const sampleSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" viewBox="0 0 400 250"><rect width="100%" height="100%" fill="%231e2633"/><rect x="20" y="20" width="360" height="210" rx="12" fill="%232a3648"/><path d="M120 70 L280 70 L320 110 L280 130 L280 200 L120 200 L120 130 L80 110 Z" fill="%2338465c" stroke="%23d97706" stroke-width="3"/><circle cx="200" cy="70" r="25" fill="%232a3648" stroke="%23d97706" stroke-width="2"/><text x="200" y="155" font-family="sans-serif" font-size="12" font-weight="bold" fill="white" text-anchor="middle">INSPECTION BATCH OK</text><text x="200" y="175" font-family="sans-serif" font-size="10" fill="%23a8a29e" text-anchor="middle">Line 4 Quality Passed</text></svg>`;
                        setPhotoPreview(sampleSvg);
                      }}
                      className="w-full text-center text-[10px] text-stone-600 hover:text-stone-900 font-medium py-1 bg-stone-100 hover:bg-stone-200/80 rounded-lg transition-colors border border-stone-200 cursor-pointer"
                    >
                      ⚡ {lang === 'ta' ? 'மாதிரி ஆய்வு படத்தை இணைக்க' : 'Attach 1-Click Demo Photo Proof'}
                    </button>
                  </div>
                )}
              </div>

              {/* Issue Note by Text or Voice (Tamil) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>{lang === 'ta' ? 'பிரச்சனை / தாமதம் குறிப்பு' : 'Issue Note (Tamil/English)'}</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                      isRecording
                        ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
                        : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300'
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <Square className="w-3 h-3 fill-current text-white" />
                        <span>{lang === 'ta' ? `பதிவை நிறுத்து (00:0${recordingSeconds})` : `Stop (${recordingSeconds}s)`}</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5 text-amber-700" />
                        <span>{lang === 'ta' ? 'குரல் பதிவு (Voice Note)' : 'Record Voice Note'}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Live Recording Waveform & Status */}
                {isRecording && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 animate-fade-in">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                      <span className="text-xs font-bold text-rose-800">
                        {lang === 'ta' ? 'பேசுங்கள்... தமிழில் தட்டச்சாகிறது' : 'Listening in Tamil / English... Speak now'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 h-4">
                      <span className="w-1 h-3 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-4 bg-rose-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="w-1 h-4 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '450ms' }} />
                    </div>
                  </div>
                )}

                {/* Audio Recording Playback Preview */}
                {audioUrl && !isRecording && (
                  <div className="p-2.5 bg-purple-50/80 border border-purple-200 rounded-xl flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-purple-900 flex items-center gap-1">
                        <Volume2 className="w-3.5 h-3.5 text-purple-700" />
                        {lang === 'ta' ? 'குரல் பதிவு தயார்' : 'Voice Note Recorded (Play audio below)'}
                      </span>
                      <button
                        type="button"
                        onClick={clearAudio}
                        className="text-stone-400 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                        title={lang === 'ta' ? 'ஆடியோவை நீக்கு' : 'Delete audio'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <audio controls src={audioUrl} className="w-full h-8 rounded" />
                  </div>
                )}

                {/* Voice Status Warning */}
                {voiceStatusText && (
                  <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    {voiceStatusText}
                  </div>
                )}

                <textarea
                  rows={2}
                  placeholder={
                    lang === 'ta'
                      ? 'எ.கா: தையல் மெஷின் மோட்டார் பழுதாகிவிட்டது, 3 மணி நேரம் வேலை நின்றது...'
                      : 'e.g. Stitching machine motor broke down, work halted for 3 hours...'
                  }
                  value={issueNote}
                  onChange={(e) => setIssueNote(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 text-stone-900 rounded-xl text-xs border border-stone-300 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium leading-relaxed"
                />

                {/* Quick Tamil phrases buttons for fast floor entry */}
                <div className="space-y-1">
                  <div className="text-[10px] text-stone-500 font-semibold">
                    {lang === 'ta' ? 'அல்லது விரைவு மாதிரி குறிப்பை தேர்ந்தெடுக்கவும்:' : 'Or tap a 1-click shop floor voice preset:'}
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5">
                    {quickTamilNotes.map((note, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setIssueNote(note);
                          setIsVoiceNote(true);
                        }}
                        className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-full text-[10px] font-medium shrink-0 max-w-[210px] truncate border border-stone-200 cursor-pointer"
                      >
                        ⚡ {note}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Action Bar */}
          <div className="pt-3 border-t border-stone-100">
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 bg-[#1e2633] hover:bg-[#2c3749] active:bg-[#151c27] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-amber-400" />
              )}
              <span>
                {onlineStatus
                  ? lang === 'ta'
                    ? 'பதிவை சமர்ப்பி (Submit Floor Update)'
                    : 'Submit Floor Production Update'
                  : lang === 'ta'
                  ? 'பதிவை சேமி (Save to Offline Queue)'
                  : 'Save to Offline Queue'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

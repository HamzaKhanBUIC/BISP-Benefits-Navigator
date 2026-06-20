'use client';
import { useState, useRef, useEffect } from 'react';
import { X, Mic, Loader2, Volume2, HelpCircle, CheckCircle2, XCircle, ChevronRight, AlertTriangle } from 'lucide-react';
import HelpModal from './HelpModal';

type AppState = 'idle' | 'recording' | 'processing' | 'speaking';

export default function VoiceAssistantCard({ onBack }: { onBack: () => void }) {
  const [appState, setAppState] = useState<AppState>('idle');
  const [transcript, setTranscript] = useState("");
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [eligibility, setEligibility] = useState<any>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  
  // Bug fix refs
  const recordingStartTime = useRef<number>(0);
  const isCancelledRef = useRef<boolean>(false);

  // Keep history for context
  const historyRef = useRef<any[]>([]);

  useEffect(() => {
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
    };
  }, []);

  const startRecording = async (e: React.PointerEvent<HTMLDivElement>) => {
    if (appState === 'processing' || appState === 'speaking') return;
    
    // BUG FIX 1: Pointer Capture prevents the ghost click if the button moves
    e.currentTarget.setPointerCapture(e.pointerId);
    
    try {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        if (isCancelledRef.current) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        // BUG FIX 2: We only clear the UI *after* successful recording is complete
        setEligibility(null);
        setTranscript("Thinking...");
        
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      isCancelledRef.current = false;
      recordingStartTime.current = Date.now();
      mediaRecorder.start();
      setAppState('recording');
      setTtsError(null);
    } catch (err) {
      console.error("Mic error:", err);
      setTranscript("Microphone access denied.");
      setAppState('idle');
    }
  };

  const stopRecording = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId);

    if (mediaRecorderRef.current && appState === 'recording') {
      const duration = Date.now() - recordingStartTime.current;
      
      // BUG FIX 1: Enforce minimum recording duration (500ms) to prevent empty files
      if (duration < 500) {
        isCancelledRef.current = true;
        mediaRecorderRef.current.stop();
        setAppState('idle');
        return;
      }
      
      mediaRecorderRef.current.stop();
      setAppState('processing');
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('history', JSON.stringify(historyRef.current));

      const res = await fetch('/api/chat', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      historyRef.current = data.history;

      setTranscript(data.aiText);
      if (data.eligibility) {
        setEligibility(data.eligibility);
      }
      
      if (data.ttsError) {
        setTtsError(data.ttsError);
      }

      if (data.audioBase64) {
        setAppState('speaking');
        const audio = new Audio(`data:audio/mp3;base64,${data.audioBase64}`);
        audioPlayerRef.current = audio;
        
        audio.onended = () => {
          setAppState('idle');
        };
        
        await audio.play();
      } else {
        setAppState('idle');
      }

    } catch (err) {
      console.error("API error:", err);
      setTranscript("Connection error. Please try again.");
      setAppState('idle');
    }
  };

  return (
    // BUG FIX 3 & 4: Mobile responsiveness and Flex overflow fixes
    <div className="w-full bg-white/95 backdrop-blur-xl md:rounded-[2.5rem] shadow-2xl md:border border-slate-200 flex flex-col relative overflow-hidden animate-in slide-in-from-bottom-8 fade-in duration-500 h-[100dvh] md:h-[85vh] md:max-h-[850px] max-w-lg">
      
      {/* Top Controls */}
      <button onClick={onBack} className="absolute top-4 left-4 md:top-6 md:left-6 text-slate-500 hover:text-ink bg-slate-100 hover:bg-slate-200 p-2 md:p-3 rounded-full transition-all active:scale-95 z-30" aria-label="Go back">
         <X className="w-5 h-5 md:w-6 md:h-6" />
      </button>
      <button onClick={() => setIsHelpOpen(true)} className="absolute top-4 right-4 md:top-6 md:right-6 text-brand-blue bg-blue-50 hover:bg-blue-100 p-2 md:p-3 rounded-full transition-all active:scale-95 z-30" aria-label="Help">
         <HelpCircle className="w-5 h-5 md:w-6 md:h-6" />
      </button>
      
      {/* Top Section */}
      <div className="flex flex-col items-center pt-6 md:pt-8 pb-4 shrink-0 border-b border-slate-200 bg-white shadow-sm z-20">
        <h2 className="text-2xl md:text-3xl font-extrabold text-ink mb-1 mt-4 px-14 md:px-0 text-center tracking-tight z-10">Voice Assistant</h2>
        <p className="text-brand-emerald font-bold mb-6 z-10">BISP Navigator</p>
        
        <div className="relative flex items-center justify-center w-40 h-40 md:w-56 md:h-56 mb-2 z-10">
          
          {appState === 'idle' && (
            <>
              <div className="absolute inset-[-10px] rounded-full bg-brand-emerald opacity-10 animate-[ping_3s_ease-in-out_infinite]"></div>
              <div className="absolute inset-4 rounded-full bg-brand-blue opacity-5 animate-[pulse_4s_ease-in-out_infinite]"></div>
            </>
          )}

          {appState === 'recording' && (
            <>
              <div className="absolute inset-[-30px] rounded-full bg-teal-500 opacity-20 animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
              <div className="absolute inset-[-15px] rounded-full bg-teal-400 opacity-30 animate-[pulse_1s_cubic-bezier(0.4,0,0.6,1)_infinite]"></div>
              <div className="absolute inset-0 rounded-full bg-teal-300 opacity-40 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]"></div>
            </>
          )}

          {appState === 'processing' && (
            <>
              <div className="absolute inset-[-15px] rounded-full border-4 border-transparent border-t-brand-blue border-r-brand-emerald animate-spin opacity-60 duration-1000"></div>
              <div className="absolute inset-2 rounded-full bg-slate-200 opacity-40 animate-pulse"></div>
            </>
          )}

          {appState === 'speaking' && (
            <>
              <div className="absolute inset-[-20px] rounded-full bg-brand-emerald opacity-30 animate-[pulse_0.8s_ease-in-out_infinite]"></div>
              <div className="absolute inset-[-5px] rounded-full bg-brand-blue opacity-20 animate-[ping_1.2s_ease-in-out_infinite]"></div>
            </>
          )}
          
          <div 
            onPointerDown={startRecording}
            onPointerUp={stopRecording}
            onPointerCancel={stopRecording}
            className={`relative z-10 w-28 h-28 md:w-36 md:h-36 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer text-white select-none touch-none active:scale-95
              ${appState === 'recording' ? 'bg-gradient-to-b from-teal-500 to-teal-700 shadow-teal-500/50 scale-100' : 
                appState === 'processing' ? 'bg-gradient-to-b from-slate-500 to-slate-700 shadow-slate-500/50 scale-100' :
                appState === 'speaking' ? 'bg-gradient-to-b from-brand-emerald to-emerald-700 shadow-emerald-500/50 scale-105' :
                'bg-gradient-to-br from-brand-emerald to-brand-blue shadow-blue-500/40 hover:scale-105 scale-100 animate-breathe'}`}
          >
             {appState === 'processing' ? (
                <Loader2 className="w-10 h-10 md:w-14 md:h-14 animate-spin" />
             ) : appState === 'speaking' ? (
                <Volume2 className="w-10 h-10 md:w-14 md:h-14 animate-pulse" />
             ) : (
                <Mic className="w-10 h-10 md:w-14 md:h-14" />
             )}
          </div>
        </div>

        <div className="text-center w-full max-w-sm px-2">
          <p className={`text-xl md:text-2xl font-extrabold mb-1 transition-colors duration-300
            ${appState === 'recording' ? 'text-teal-600' : 
              appState === 'processing' ? 'text-slate-600' :
              appState === 'speaking' ? 'text-brand-emerald' : 'text-ink'}`}>
            {appState === 'recording' ? 'Listening...' : 
             appState === 'processing' ? 'Thinking...' :
             appState === 'speaking' ? 'Speaking...' : 'Hold to Speak'}
          </p>
          <p className="text-base font-urdu text-slate-500 transition-opacity duration-300 mb-2">
            {appState === 'recording' ? 'سن رہا ہوں...' : 
             appState === 'processing' ? 'سوچ رہا ہوں...' :
             appState === 'speaking' ? 'بول رہا ہوں...' : 'بولنے کے لیے دبائے رکھیں'}
          </p>
          {appState === 'idle' && (
            <div className="flex flex-col items-center mt-3 animate-in fade-in duration-500">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Speak in your local language</p>
              <div className="flex flex-wrap justify-center gap-2">
                <span className="text-[10px] md:text-xs font-bold text-brand-emerald bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">Urdu</span>
                <span className="text-[10px] md:text-xs font-bold text-brand-emerald bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">Pashto</span>
                <span className="text-[10px] md:text-xs font-bold text-brand-emerald bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">Punjabi</span>
                <span className="text-[10px] md:text-xs font-bold text-brand-emerald bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">Sindhi</span>
                <span className="text-[10px] md:text-xs font-bold text-brand-emerald bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">Balochi</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Bottom Section */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 pt-6 flex flex-col w-full z-10 relative custom-scrollbar">
        
        {/* Only show transcript if no eligibility result to avoid clutter */}
        {!eligibility && transcript && (
          <div className="w-full bg-slate-50 rounded-2xl border border-slate-100 p-5 shadow-inner transition-all duration-300 flex flex-col gap-2">
            {transcript.split('\n').map((line, i) => (
              <div key={i} className="min-h-[1.5rem]" dir="auto">
                <p className={`text-ink font-medium whitespace-pre-wrap text-start ${line.match(/[\u0600-\u06FF]/) ? "font-urdu text-lg md:text-xl leading-normal" : "text-base md:text-lg"}`}>
                  {line}
                </p>
              </div>
            ))}
          </div>
        )}
        
        {ttsError && (
          <div className="mt-4 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium">
            {ttsError}
          </div>
        )}

        {eligibility && (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-6">
            
            <div className={`w-full rounded-3xl p-6 text-center shadow-lg border-2 flex flex-col items-center justify-center
              ${eligibility.eligible ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-red-50 border-red-500 text-red-800'}
            `}>
              {eligibility.eligible ? <CheckCircle2 className="w-16 h-16 mb-2 text-emerald-600" /> : <XCircle className="w-16 h-16 mb-2 text-red-600" />}
              <h3 className="text-2xl font-bold font-urdu mb-1">
                {eligibility.eligible ? 'آپ اہل ہو سکتی ہیں' : 'آپ ابھی اہل نہیں ہیں'}
              </h3>
              <p className="text-base font-bold opacity-80 uppercase tracking-wider">
                {eligibility.eligible ? 'You may qualify' : 'Not currently eligible'}
              </p>
            </div>

            {!eligibility.eligible && eligibility.fallbacks && eligibility.fallbacks.length > 0 && (
              <div className="space-y-3 text-left">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-2">Recommended Alternatives</h4>
                {eligibility.fallbacks.map((fb: any, idx: number) => (
                  <div key={idx} className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-4">
                    <div className="bg-brand-blue text-white rounded-full p-2 shrink-0"><ChevronRight className="w-5 h-5"/></div>
                    <div>
                      <p className="font-bold text-brand-blue text-lg">{fb.name}</p>
                      <p className="text-sm text-slate-600 leading-relaxed mt-1">{fb.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {eligibility.pmt && (
              <div className="bg-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden text-left mb-6">
                <div className="absolute top-0 right-0 bg-brand-emerald text-xs font-bold px-3 py-1 rounded-bl-xl tracking-wider uppercase shadow-md">For Judges</div>
                <h4 className="text-lg font-bold mb-4 flex items-center"><AlertTriangle className="w-5 h-5 mr-2 text-amber-400"/> AI Reasoning: PMT Proxy</h4>
                
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2 font-medium opacity-80">
                    <span>Estimated PMT Score (proxy): <span className="font-bold text-white text-lg">{eligibility.pmt.score}</span></span>
                    <span>Cutoff: {eligibility.pmt.cutoff}</span>
                  </div>
                  <div className="w-full bg-slate-700 h-4 rounded-full overflow-hidden relative">
                    <div className="absolute top-0 bottom-0 w-1 bg-red-500 z-10" style={{ left: `${eligibility.pmt.cutoff}%` }}></div>
                    <div className={`absolute top-0 left-0 bottom-0 transition-all duration-1000 ${eligibility.pmt.score <= eligibility.pmt.cutoff ? 'bg-brand-emerald' : 'bg-slate-400'}`} style={{ width: `${eligibility.pmt.score}%` }}></div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 text-right">Lower score indicates higher poverty level.</p>
                </div>

                <div className="mb-5 text-sm bg-slate-700/50 p-3 rounded-xl border border-slate-600">
                  <p className="font-bold text-amber-400 mb-1">Confidence: {eligibility.pmt.confidence}</p>
                  <p className="text-slate-300">{eligibility.pmt.confidenceReason}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-700 pb-1">Factor Weights</p>
                   {eligibility.pmt.factors.map((f: any, idx: number) => (
                     <div key={idx} className="flex justify-between text-sm border-b border-slate-700/50 pb-2">
                       <span className="text-slate-300">{f.name}: {f.value}</span>
                       <span className={`font-bold ${f.weight > 0 ? 'text-red-400' : f.weight < 0 ? 'text-brand-emerald' : 'text-slate-400'}`}>
                         {f.weight > 0 ? `+${f.weight}` : f.weight === 0 ? '0' : f.weight}
                       </span>
                     </div>
                   ))}
                   <div className="flex justify-between text-sm pt-1 font-bold text-slate-200">
                       <span>Base Score</span>
                       <span className="text-slate-400">45</span>
                   </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-auto pt-6 w-full text-center pb-4 md:pb-0">
          <p className="text-xs text-slate-500 font-medium">
            Disclaimer: AI-assisted guidance based on BISP 2026 Guidelines. Not an official government decision.
          </p>
        </div>
      </div>

      {isHelpOpen && <HelpModal onClose={() => setIsHelpOpen(false)} />}
    </div>
  );
}

'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Mic, MessageSquare, HelpCircle, Volume2 } from 'lucide-react';
import VoiceAssistantCard from './VoiceAssistantCard';
import LowLiteracyDashboard from './LowLiteracyDashboard';
import HelpModal from './HelpModal';

export default function InteractiveConsole() {
  const [mode, setMode] = useState<'IDLE' | 'VOICE' | 'TEXT'>('IDLE');
  const [showHelp, setShowHelp] = useState(false);
  const [isPlayingWelcome, setIsPlayingWelcome] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const playWelcome = () => {
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        setIsPlayingWelcome(true);
      }).catch(e => console.error(e));
    }
  };

  useEffect(() => {
    // Attempt autoplay on mount
    if (audioRef.current) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsPlayingWelcome(true);
        }).catch(error => {
          console.log("Browser blocked autoplay. User must click the play button.", error);
        });
      }
    }
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-full relative">
      {/* Help Button */}
      {mode === 'IDLE' && (
        <button
          onClick={() => setShowHelp(true)}
          className="absolute top-4 right-4 md:top-8 md:right-8 p-3 text-brand-blue bg-white hover:bg-slate-100 rounded-full shadow-md hover:scale-105 active:scale-95 transition-transform"
          aria-label="Help and Security Information"
        >
          <HelpCircle className="w-8 h-8" />
        </button>
      )}

      {/* Audio Button */}
      {mode === 'IDLE' && (
        <button
          onClick={playWelcome}
          disabled={isPlayingWelcome}
          className={`absolute top-4 left-4 md:top-8 md:left-8 p-3 rounded-full shadow-md transition-transform ${
            isPlayingWelcome 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed scale-95' 
              : 'bg-white text-brand-emerald hover:bg-emerald-50 hover:scale-105 active:scale-95'
          }`}
          aria-label="Play Welcome Message"
        >
          <Volume2 className={`w-8 h-8 ${isPlayingWelcome ? 'animate-pulse' : ''}`} />
        </button>
      )}

      {mode === 'IDLE' && (
        <div className="flex flex-col items-center w-full max-w-2xl bg-white/90 backdrop-blur-md p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-slate-200 text-center transition-all animate-in slide-in-from-bottom-8 fade-in duration-500 relative overflow-hidden">
          
          {/* Subtle top decorative bar and gradient */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-emerald via-emerald-400 to-brand-blue"></div>
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-emerald-50 to-transparent pointer-events-none"></div>

          <div className="mb-10 relative z-10">
            <h1 className="text-3xl md:text-5xl font-extrabold text-ink mb-4 tracking-tight">
              BISP Benefits Navigator
            </h1>
            <p className="text-xl md:text-2xl text-brand-emerald font-bold mb-4 tracking-wide">
              Benazir Income Support Programme
            </p>
            <div className="h-1 w-24 bg-brand-blue mx-auto rounded-full mb-6"></div>
            <p className="text-lg md:text-xl text-slate-700 font-medium max-w-md mx-auto leading-relaxed mb-6">
              Choose how you want to interact
              <span className="text-base font-urdu opacity-90 mt-2 block font-normal">
                منتخب کریں کہ آپ کس طرح رابطہ کرنا چاہتے ہیں
              </span>
            </p>
          </div>
          
          <audio ref={audioRef} src="/welcome.mp3" onEnded={() => setIsPlayingWelcome(false)} className="hidden" />
          
          <div className="flex flex-col sm:flex-row w-full gap-6">
             <button 
               onClick={() => setMode('VOICE')}
               className="flex-1 flex flex-col items-center justify-center p-8 bg-brand-emerald text-white rounded-[2rem] hover:bg-emerald-700 shadow-md hover:shadow-xl hover:-translate-y-1 active:scale-95 active:translate-y-0 transition-all duration-300 group"
             >
               <div className="bg-white/20 p-5 rounded-full mb-5 group-hover:scale-110 transition-transform duration-300">
                 <Mic className="w-12 h-12" />
               </div>
               <span className="text-2xl font-bold tracking-wide">Voice Assistant</span>
               <span className="text-lg font-urdu opacity-90 mt-2">آواز کے ذریعے</span>
             </button>
             
             <button 
               onClick={() => setMode('TEXT')}
               className="flex-1 flex flex-col items-center justify-center p-8 bg-brand-blue text-white rounded-[2rem] hover:bg-blue-800 shadow-md hover:shadow-xl hover:-translate-y-1 active:scale-95 active:translate-y-0 transition-all duration-300 group"
             >
               <div className="bg-white/20 p-5 rounded-full mb-5 group-hover:scale-110 transition-transform duration-300">
                 <MessageSquare className="w-12 h-12" />
               </div>
               <span className="text-2xl font-bold tracking-wide">Text Chat</span>
               <span className="text-lg font-urdu opacity-90 mt-2">لکھ کر</span>
             </button>
          </div>
          
          <div className="mt-8 text-sm text-slate-500 font-medium hover:text-brand-blue transition-colors">
            <Link href="/privacy">Privacy Policy (پرائیویسی پالیسی)</Link>
          </div>
        </div>
      )}

      {mode === 'VOICE' && <VoiceAssistantCard onBack={() => setMode('IDLE')} />}
      {mode === 'TEXT' && <LowLiteracyDashboard onBack={() => setMode('IDLE')} />}

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}

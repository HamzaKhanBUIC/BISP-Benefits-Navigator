'use client';
import { useState, useRef, useEffect } from 'react';
import { X, Send, HelpCircle, CheckCircle, Building, CheckCircle2, XCircle, ChevronRight, AlertTriangle } from 'lucide-react';
import HelpModal from './HelpModal';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  eligibility?: any;
};

export default function LowLiteracyDashboard({ onBack }: { onBack: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const historyRef = useRef<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userText = inputText.trim();
    setInputText('');
    setMessages(prev => [...prev, { id: Date.now().toString(), text: userText, sender: 'user' }]);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('text', userText);
      formData.append('history', JSON.stringify(historyRef.current));

      const res = await fetch('/api/chat', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      historyRef.current = data.history;

      setMessages(prev => [...prev, { id: Date.now().toString() + 'ai', text: data.aiText, sender: 'agent', eligibility: data.eligibility }]);

    } catch (err) {
      console.error("Chat error:", err);
      setMessages(prev => [...prev, { id: Date.now().toString() + 'err', text: "Connection error. Please try again.", sender: 'agent' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageText = (text: string, sender: 'user' | 'agent') => {
    const isUrdu = /[\u0600-\u06FF]/.test(text);
    const textClass = isUrdu ? "font-urdu text-lg md:text-xl leading-normal" : "text-lg";
    // CheckCircle color changes based on bubble background
    const iconColor = sender === 'user' ? 'text-white' : 'text-brand-emerald';

    return (
      <div className={`${textClass} whitespace-pre-wrap`} dir="auto">
        {text.split('\n').map((line, i) => {
          const parts = line.split(/(✅|✔️|☑️)/);
          return (
            <div key={i} className="min-h-[1.5rem]" dir="auto">
              {parts.map((part, j) => {
                if (['✅', '✔️', '☑️'].includes(part)) {
                  return <CheckCircle key={j} className={`inline-block w-5 h-5 ${iconColor} mr-2 align-text-bottom`} />;
                }
                return <span key={j}>{part}</span>;
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full max-w-3xl bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl p-4 md:p-8 flex flex-col h-[85vh] relative border-t-8 border-brand-emerald animate-in slide-in-from-bottom-8 duration-500">
       
       {/* Header */}
       <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
         <button onClick={onBack} className="text-slate-500 hover:text-ink bg-slate-100 p-3 rounded-full hover:bg-slate-200 transition-colors active:scale-95" aria-label="Go back">
           <X className="w-6 h-6" />
         </button>
         <div className="text-center">
           <h2 className="text-2xl md:text-3xl font-extrabold text-ink tracking-tight">Text Chat</h2>
           <span className="text-sm text-brand-emerald font-bold bg-emerald-50 px-3 py-1 rounded-full mt-1 inline-block">لکھ کر بات کریں</span>
         </div>
         <button onClick={() => setIsHelpOpen(true)} className="text-brand-blue hover:text-blue-800 bg-blue-50 p-3 rounded-full hover:bg-blue-100 transition-colors shadow-sm border border-blue-100 active:scale-95" aria-label="Help">
           <HelpCircle className="w-6 h-6" />
         </button>
       </div>

       {/* Chat Area */}
       <div className="flex-1 overflow-y-auto mb-4 space-y-5 pr-2 scroll-smooth">
         {messages.map((msg) => (
           <div key={msg.id} className={`flex transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
             
             {msg.sender === 'agent' && (
               <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mr-3 shrink-0 self-end mb-1">
                 <Building className="w-5 h-5 text-brand-emerald" />
               </div>
             )}

             <div className={`max-w-[80%] rounded-2xl p-5 shadow-sm ${
               msg.sender === 'user' 
                 ? 'bg-brand-emerald text-white rounded-br-sm' 
                 : 'bg-slate-100 text-ink rounded-bl-sm border border-slate-200'
             }`}>
               {renderMessageText(msg.text, msg.sender)}
               
               {msg.eligibility && (
                 <div className="w-full mt-6 flex flex-col gap-4 text-left font-sans" dir="ltr">
                   <div className={`w-full rounded-2xl p-4 text-center shadow-sm border-2 flex flex-col items-center justify-center
                     ${msg.eligibility.eligible ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-red-50 border-red-500 text-red-800'}
                   `}>
                     {msg.eligibility.eligible ? <CheckCircle2 className="w-12 h-12 mb-2 text-emerald-600" /> : <XCircle className="w-12 h-12 mb-2 text-red-600" />}
                     <h3 className="text-xl font-bold font-urdu mb-1" dir="rtl">
                       {msg.eligibility.eligible ? 'آپ اہل ہو سکتی ہیں' : 'آپ ابھی اہل نہیں ہیں'}
                     </h3>
                     <p className="text-sm font-bold opacity-80 uppercase tracking-wider">
                       {msg.eligibility.eligible ? 'You may qualify' : 'Not currently eligible'}
                     </p>
                   </div>

                   {!msg.eligibility.eligible && msg.eligibility.fallbacks && msg.eligibility.fallbacks.length > 0 && (
                     <div className="space-y-3 mt-2">
                       <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Recommended Alternatives</h4>
                       {msg.eligibility.fallbacks.map((fb: any, idx: number) => (
                         <div key={idx} className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-3">
                           <div className="bg-brand-blue text-white rounded-full p-1.5 shrink-0"><ChevronRight className="w-4 h-4"/></div>
                           <div>
                             <p className="font-bold text-brand-blue text-base">{fb.name}</p>
                             <p className="text-sm text-slate-600 leading-snug mt-1">{fb.reason}</p>
                           </div>
                         </div>
                       ))}
                     </div>
                   )}

                   {msg.eligibility.pmt && (
                     <div className="bg-slate-800 rounded-2xl p-5 text-white shadow-md relative overflow-hidden mt-2">
                       <div className="absolute top-0 right-0 bg-brand-emerald text-[10px] font-bold px-2 py-1 rounded-bl-lg tracking-wider uppercase shadow-sm">For Judges</div>
                       <h4 className="text-base font-bold mb-4 flex items-center"><AlertTriangle className="w-4 h-4 mr-2 text-amber-400"/> AI Reasoning: PMT Proxy</h4>
                       
                       <div className="mb-5">
                         <div className="flex justify-between text-xs mb-2 font-medium opacity-80">
                           <span>Estimated PMT Score (proxy): <span className="font-bold text-white text-base">{msg.eligibility.pmt.score}</span></span>
                           <span>Cutoff: {msg.eligibility.pmt.cutoff}</span>
                         </div>
                         <div className="w-full bg-slate-700 h-3 rounded-full overflow-hidden relative">
                           <div className="absolute top-0 bottom-0 w-1 bg-red-500 z-10" style={{ left: `${msg.eligibility.pmt.cutoff}%` }}></div>
                           <div className={`absolute top-0 left-0 bottom-0 transition-all duration-1000 ${msg.eligibility.pmt.score <= msg.eligibility.pmt.cutoff ? 'bg-brand-emerald' : 'bg-slate-400'}`} style={{ width: `${msg.eligibility.pmt.score}%` }}></div>
                         </div>
                         <p className="text-[10px] text-slate-400 mt-1 text-right">Lower score indicates higher poverty level.</p>
                       </div>

                       <div className="mb-4 text-xs bg-slate-700/50 p-3 rounded-lg border border-slate-600">
                         <p className="font-bold text-amber-400 mb-1">Confidence: {msg.eligibility.pmt.confidence}</p>
                         <p className="text-slate-300 leading-snug">{msg.eligibility.pmt.confidenceReason}</p>
                       </div>

                       <div className="space-y-1">
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-700 pb-1">Factor Weights</p>
                          {msg.eligibility.pmt.factors.map((f: any, idx: number) => (
                            <div key={idx} className="flex justify-between text-xs border-b border-slate-700/50 pb-1.5">
                              <span className="text-slate-300">{f.name}: {f.value}</span>
                              <span className={`font-bold ${f.weight > 0 ? 'text-red-400' : f.weight < 0 ? 'text-brand-emerald' : 'text-slate-400'}`}>
                                {f.weight > 0 ? `+${f.weight}` : f.weight === 0 ? '0' : f.weight}
                              </span>
                            </div>
                          ))}
                          <div className="flex justify-between text-xs pt-1 font-bold text-slate-200">
                              <span>Base Score</span>
                              <span className="text-slate-400">45</span>
                          </div>
                       </div>
                     </div>
                   )}
                 </div>
               )}
             </div>
           </div>
         ))}
         
         {isLoading && (
           <div className="flex justify-start transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
             <div className="bg-slate-100 rounded-2xl rounded-bl-sm p-5 border border-slate-200 flex items-center space-x-2 h-14 w-20 shadow-sm">
               <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce"></div>
               <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
               <div className="w-2.5 h-2.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
             </div>
           </div>
         )}
         <div ref={messagesEndRef} className="h-1" />
       </div>

       {/* Input Area */}
       <form onSubmit={handleSubmit} className="relative mt-auto bg-white pt-2">
         <input 
           type="text" 
           value={inputText}
           onChange={(e) => setInputText(e.target.value)}
           placeholder="Type your message here..."
           className="w-full text-lg p-5 pr-16 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-brand-emerald focus:ring-4 focus:ring-emerald-100 outline-none transition-all text-ink shadow-inner"
           dir="auto"
           disabled={isLoading}
         />
         <button 
           type="submit"
           disabled={isLoading || !inputText.trim()}
           className="absolute right-3 top-5 bottom-3 aspect-square bg-brand-emerald hover:bg-emerald-700 disabled:bg-slate-300 disabled:shadow-none text-white rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95"
           aria-label="Send message"
         >
           <Send className="w-6 h-6 -ml-0.5" />
         </button>
       </form>

       <div className="mt-4 w-full text-center pb-1">
         <p className="text-xs text-slate-500 font-medium">Disclaimer: AI-assisted guidance based on BISP 2026 Guidelines. Not an official government decision.</p>
       </div>

       {isHelpOpen && <HelpModal onClose={() => setIsHelpOpen(false)} />}
    </div>
  );
}


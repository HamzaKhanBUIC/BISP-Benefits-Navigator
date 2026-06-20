import React from 'react';
import Link from 'next/link';
import { X, Phone, Globe, ShieldAlert, Building, MessageSquare, ShieldCheck } from 'lucide-react';

export default function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 md:p-8 pb-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-extrabold text-ink tracking-tight">Help & Security</h2>
            <button onClick={onClose} className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-ink rounded-full transition-colors active:scale-95" aria-label="Close">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-5 max-h-[55vh] overflow-y-auto pr-2 scroll-smooth pb-4">
            
            {/* Helpline */}
            <div className="bg-blue-50 border border-blue-100 rounded-[1.5rem] p-5">
              <h3 className="font-bold text-brand-blue text-lg flex items-center mb-2">
                <Phone className="w-5 h-5 mr-2" />
                Official BISP Helpline
              </h3>
              <p className="text-ink font-extrabold text-2xl mb-1">0800-26477</p>
              <p className="text-slate-600 text-sm">Toll-Free. Available during working hours for inquiries regarding payments, registration status, and program info.</p>
            </div>

            {/* Online Portals */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-[1.5rem] p-5">
              <h3 className="font-bold text-brand-emerald text-lg flex items-center mb-3">
                <Globe className="w-5 h-5 mr-2" />
                Online Portals
              </h3>
              <div className="mb-3">
                <p className="font-bold text-ink flex items-center"><Globe className="w-4 h-4 mr-2 text-brand-emerald" />8171 Web Portal:</p>
                <p className="text-slate-600 text-sm ml-6">Check eligibility and payment status at <a href="https://8171.bisp.gov.pk" target="_blank" rel="noreferrer" className="text-brand-emerald underline font-medium">8171.bisp.gov.pk</a></p>
              </div>
              <div>
                <p className="font-bold text-ink flex items-center"><MessageSquare className="w-4 h-4 mr-2 text-brand-emerald" />SMS Service:</p>
                <p className="text-slate-600 text-sm ml-6">Send your 13-digit CNIC to <span className="font-bold text-brand-emerald">8171</span>.</p>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-red-50 border border-red-100 rounded-[1.5rem] p-5">
              <h3 className="font-bold text-red-700 text-lg flex items-center mb-3">
                <ShieldAlert className="w-5 h-5 mr-2" />
                Security Notice
              </h3>
              <ul className="space-y-3 text-sm text-red-900/80">
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 mr-2 shrink-0"></span>
                  <span><span className="font-bold text-red-800">No Fees:</span> Registration is 100% free. Never pay anyone to "speed up" your application.</span>
                </li>
                <li className="flex items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 mr-2 shrink-0"></span>
                  <span><span className="font-bold text-red-800">Beware of Scams:</span> BISP does not use private numbers to ask for processing fees or PINs.</span>
                </li>
              </ul>
            </div>

            <div className="text-center text-sm text-slate-500 flex flex-col items-center justify-center pt-2 gap-2">
              <div className="flex items-center">
                <Building className="w-4 h-4 mr-1.5" />
                <p>Headquarters: F-Block, Secretariat, Islamabad</p>
              </div>
              <Link href="/privacy" className="flex items-center text-brand-blue hover:underline">
                <ShieldCheck className="w-4 h-4 mr-1.5" />
                <span>Read our Privacy Policy</span>
              </Link>
            </div>
            
          </div>
        </div>

        {/* Action Button Footer */}
        <div className="p-6 pt-0">
          <button 
            onClick={onClose} 
            className="w-full bg-brand-emerald hover:bg-emerald-700 text-white font-bold text-lg py-4 rounded-2xl transition-all shadow-md active:scale-95 flex items-center justify-center"
          >
            Got it
          </button>
        </div>

      </div>
    </div>
  );
}

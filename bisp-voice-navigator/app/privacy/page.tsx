import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <main className="min-h-full w-full bg-slate-50 text-slate-800 p-4 md:p-8 flex justify-center">
      <div className="max-w-3xl w-full bg-white p-8 md:p-12 rounded-[2rem] shadow-sm border border-slate-200">
        <Link href="/" className="inline-flex items-center text-brand-blue hover:underline mb-8 font-medium transition-all hover:-translate-x-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        
        <div className="flex items-center gap-4 mb-8">
          <ShieldCheck className="w-12 h-12 text-brand-emerald" />
          <h1 className="text-3xl md:text-4xl font-extrabold text-ink tracking-tight">Privacy Policy</h1>
        </div>
        
        <div className="space-y-6 text-lg leading-relaxed text-slate-700">
          <p>
            Welcome to the <strong>BISP Benefits Navigator</strong>. As a third-party civic technology application designed to help citizens understand the Benazir Income Support Programme, we take your privacy and data security extremely seriously.
          </p>
          
          <h2 className="text-2xl font-bold text-ink mt-8">1. Information We Collect</h2>
          <p>
            This application is designed to be purely navigational and informational. <strong>We do not require, collect, or store personal identifying information</strong> such as your CNIC, banking details, or exact physical address.
          </p>
          
          <h2 className="text-2xl font-bold text-ink mt-8">2. Third-Party Data Processors</h2>
          <p>
            Because this application uses advanced Artificial Intelligence to understand regional languages and provide conversational answers, your voice and text inputs are temporarily processed by industry-leading, secure third-party services:
          </p>
          <ul className="list-disc pl-6 space-y-3 bg-slate-50 p-6 rounded-xl border border-slate-100">
            <li><strong>Deepgram:</strong> Converts your spoken voice into text in real-time.</li>
            <li><strong>Google Gemini (GCP):</strong> Acts as the core reasoning engine to understand your intent and cross-reference it with public BISP rules.</li>
            <li><strong>ElevenLabs:</strong> Synthesizes the natural, conversational AI voice output.</li>
            <li><strong>Google Cloud Platform (GCP):</strong> Provides the secure infrastructure hosting this application.</li>
          </ul>
          <p>
            These processors analyze the input strictly to generate a response in real-time. We have configured these APIs to prioritize security, and your data is not sold or used to train public models.
          </p>
          
          <h2 className="text-2xl font-bold text-ink mt-8">3. No Data Storage</h2>
          <p>
            We do not store your voice recordings or chat transcripts on our servers. Once your session ends, the conversational context is immediately discarded.
          </p>
          
          <h2 className="text-2xl font-bold text-ink mt-8">4. Not an Official Government Application</h2>
          <p>
            Please note that BISP Benefits Navigator is an independent, third-party prototype created for the USAII Global AI Hackathon. It is not an official government platform. Always verify eligibility and final decisions directly with official BISP channels (Toll-Free: 0800-26477) or at a registered Tehsil office.
          </p>
        </div>
      </div>
    </main>
  );
}

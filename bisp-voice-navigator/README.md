<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/mic.svg" alt="Logo" width="80" height="80">
  
  <h1 align="center">BISP Benefits Navigator</h1>
  
  <p align="center">
    <strong>An AI-powered, voice-first civic technology pre-screener for the next billion users.</strong>
    <br />
    <br />
    <a href="https://bisp-benefits-navigator-359691438955.us-central1.run.app"><strong>View Live Demo »</strong></a>
    <br />
    <br />
  </p>
</div>

<p align="center">
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js" /></a>
  <a href="https://cloud.google.com/run"><img src="https://img.shields.io/badge/Google_Cloud_Run-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white" alt="GCP" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" /></a>
  <a href="https://deepmind.google/technologies/gemini/"><img src="https://img.shields.io/badge/Gemini_2.5_Flash-FFD700?style=for-the-badge&logo=google&logoColor=black" alt="Gemini" /></a>
</p>

---

## 🌍 The Mission

In Pakistan, millions of women living below the poverty line are eligible for the Benazir Income Support Programme (BISP) but fail to access it due to a massive digital and literacy divide. Traditional web portals rely on complex dropdowns, legal jargon, and text-heavy forms. For a rural, illiterate woman, an online form is just as insurmountable as a closed door. 

**BISP Benefits Navigator** bridges this gap using AI. It allows citizens to determine their eligibility for social support simply by speaking in their native regional dialects. We didn't try to teach people how to use technology; we taught technology how to understand people.

---

## ✨ Key Features

- 🎙️ **Voice-First Interface**: A "Low-Literacy Dashboard" that strips away complex UI elements in favor of a single, massive glowing microphone button.
- 🗣️ **Native Dialect Understanding**: Processes Urdu, Pashto, Punjabi, Sindhi, and Balochi naturally using the **Deepgram Nova-3 API** without destroying cultural nuance through legacy translation APIs.
- 🧠 **Deterministic AI Rules Engine**: Instead of trusting an LLM to hallucinate math, Gemini is strictly forced to use a deterministic backend Rules Engine (`bisp-rules-engine.ts`) to calculate the Proxy Means Test (PMT) score based on 2026 guidelines.
- 🛡️ **Anti-Abuse API Quota Shuffling**: An intelligent backend defense mechanism that catches `429 Quota Exceeded` errors from free-tier APIs and instantly rotates through an array of backup API keys, ensuring the app never crashes under heavy hackathon traffic.
- 🌐 **Dual-Language Isolation**: The AI speaks exclusively in the user's regional language to maintain immersion, while the UI displays a side-by-side English translation for educated helpers or judges.
- 🔒 **IP Rate Limiting**: Built-in `x-forwarded-for` memory map that strictly limits users to 10 requests per minute to prevent malicious API draining.

---

## 🏗️ Architecture Flow

```mermaid
graph TD
    A[User Speaks (Microphone)] -->|WebM Audio| B(Deepgram STT API)
    B -->|Regional Transcript| C{Gemini 2.5 Flash}
    C -->|Extracts Demographics| D[Node.js BISP Rules Engine]
    D -->|Deterministic PMT Score| C
    C -->|Dual-Language Response| E[Regex Stripper]
    E -->|UI Display (Both)| F[Next.js Frontend]
    E -->|Regional Text Only| G(ElevenLabs TTS API)
    G -->|Warm, Empathetic Audio| H[User Listens]
```

---

## 💻 Tech Stack

### Frontend
- **Next.js 16** (App Router)
- **React 19**
- **Tailwind CSS** (for responsive, modern, low-literacy UI)
- **Lucide React** (Icons)

### Backend & AI
- **Google Gemini 2.5 Flash** (via `@google/genai` SDK)
- **Deepgram API** (Nova-3 for Speech-to-Text)
- **ElevenLabs API** (`eleven_multilingual_v2` for Text-to-Speech)
- **Node.js**

### DevOps
- **Docker**
- **Google Cloud Run**
- **Google Cloud Build**

---

## 🚀 Getting Started

To run this project locally, you will need Node.js 18+ and API keys for Google Gemini, Deepgram, and ElevenLabs.

### 1. Clone the repository
```bash
git clone https://github.com/HamzaKhanBUIC/BISP-Benefits-Navigator.git
cd BISP-Benefits-Navigator
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory and add your API keys. *Note: You can add multiple keys (e.g., `GEMINI_API_KEY_2`) to utilize the built-in quota shuffling system!*

```env
GEMINI_API_KEY=your_gemini_key_here
DEEPGRAM_API_KEY=your_deepgram_key_here
ELEVENLABS_API_KEY=your_elevenlabs_key_here
```

### 4. Generate the Offline Welcome Audio
To prevent burning ElevenLabs quota on initial page load, run the offline generator script:
```bash
node generate-welcome.mjs
```

### 5. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 🔐 Responsible AI

Because this application deals with government financial aid, we implemented strict **Responsible AI Guardrails**:
1. **No LLM Math**: Gemini is completely stripped of its ability to calculate eligibility math to prevent hallucinations.
2. **Mandatory Spoken Disclaimer**: The System Prompt forces the AI to append an explicit disclaimer to all positive results: *"I am an AI assistant, not an official. You must visit the local BISP office for final approval."*
3. **Human-in-the-Loop**: The app makes it clear that it is merely a pre-screener. Physical verification of identity (CNIC) and assets by a NADRA/BISP official remains legally required.

---

<div align="center">
  Made with ❤️ for the women of Pakistan.
</div>

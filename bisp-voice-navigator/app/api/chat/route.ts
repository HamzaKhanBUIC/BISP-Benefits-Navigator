import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { SYSTEM_PROMPT } from '../../../lib/system-prompt';
import { checkEligibilityDeclaration, executeEligibilityCheck } from '../../../lib/agent-tools';

// --- IP Rate Limiter ---
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();
const RATE_LIMIT = 10; // 10 requests per minute per IP
const RATE_LIMIT_WINDOW = 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (record.count >= RATE_LIMIT) {
    return false; // Limit exceeded
  }
  record.count++;
  return true;
}

const geminiKeys = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
  process.env.GEMINI_API_KEY_5,
  process.env.GEMINI_API_KEY_6
].filter(Boolean) as string[];

let currentKeyIndex = 0;

// --- ElevenLabs Multi-Key Fallback ---
const elevenLabsKeys = [
  process.env.ELEVENLABS_API_KEY,
  process.env.ELEVENLABS_API_KEY_2,
  process.env.ELEVENLABS_API_KEY_3,
  process.env.ELEVENLABS_API_KEY_4,
  process.env.ELEVENLABS_API_KEY_5
].filter(Boolean) as string[];

let currentElevenKeyIndex = 0;

// --- Deepgram Multi-Key Fallback ---
const deepgramKeys = [
  process.env.DEEPGRAM_API_KEY,
  process.env.DEEPGRAM_API_KEY_2,
  process.env.DEEPGRAM_API_KEY_3,
  process.env.DEEPGRAM_API_KEY_4,
  process.env.DEEPGRAM_API_KEY_5
].filter(Boolean) as string[];

let currentDeepgramKeyIndex = 0;

async function generateWithFallback(history: any[]): Promise<any> {
  if (geminiKeys.length === 0) throw new Error("No Gemini API keys configured.");
  
  let attempts = 0;
  while (attempts < geminiKeys.length) {
    const key = geminiKeys[currentKeyIndex];
    const ai = new GoogleGenAI({ apiKey: key });
    
    try {
      console.log(`Trying Gemini with Key Index: ${currentKeyIndex}`);
      return await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: history,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          tools: [{ functionDeclarations: [checkEligibilityDeclaration] }],
          temperature: 0.2
        }
      });
    } catch (err: any) {
      const errMsg = err.message || '';
      if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('503') || errMsg.includes('UNAVAILABLE') || errMsg.includes('403') || errMsg.includes('PERMISSION_DENIED')) {
        console.warn(`Key ${currentKeyIndex} failed. Shuffling to next key...`);
        currentKeyIndex = (currentKeyIndex + 1) % geminiKeys.length;
        attempts++;
        // If it's a 503 (Google servers busy), wait 1 second before trying the next key to avoid immediate bouncing
        if (errMsg.includes('503')) await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        throw err; // Other errors (like 400 Bad Request) should crash immediately
      }
    }
  }
  throw new Error("All backup Gemini API keys are currently rate limited. Please try again later.");
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (ip !== 'unknown' && !checkRateLimit(ip)) {
      return NextResponse.json({ error: "Too many requests from your IP. Please try again in a minute." }, { status: 429 });
    }
    
    const formData = await req.formData();
    const audioFile = formData.get('audio') as Blob | null;
    const historyString = formData.get('history') as string | null;
    let textInput = formData.get('text') as string | null;

    let transcript = textInput || "";
    let history = historyString ? JSON.parse(historyString) : [];

    // --- STEP 1: Deepgram Speech-to-Text ---
    if (audioFile) {
      console.log("Transcribing audio with Deepgram...");
      const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
      
      let success = false;
      let attempts = 0;
      let lastDeepgramError = "Unknown error";

      if (deepgramKeys.length === 0) {
        throw new Error("No Deepgram API keys configured.");
      }

      while (attempts < deepgramKeys.length && !success) {
        const key = deepgramKeys[currentDeepgramKeyIndex];
        try {
          const deepgramRes = await fetch('https://api.deepgram.com/v1/listen?model=nova-3&language=ur', {
            method: 'POST',
            headers: {
              'Authorization': `Token ${key}`,
              'Content-Type': audioFile.type || 'audio/webm',
              'Connection': 'close'
            },
            body: audioBuffer
          });

          if (deepgramRes.ok) {
            const deepgramData = await deepgramRes.json();
            transcript = deepgramData.results?.channels[0]?.alternatives[0]?.transcript || "";
            console.log("Deepgram Transcript:", transcript);
            success = true;
          } else {
            const errText = await deepgramRes.text();
            console.error(`Deepgram error with key index ${currentDeepgramKeyIndex}:`, errText);
            if (deepgramRes.status === 401 || deepgramRes.status === 402 || deepgramRes.status === 403 || deepgramRes.status === 429 || deepgramRes.status >= 500) {
              lastDeepgramError = `HTTP ${deepgramRes.status} ${errText}`;
              console.warn("Deepgram quota/server error. Shuffling to next key...");
              currentDeepgramKeyIndex = (currentDeepgramKeyIndex + 1) % deepgramKeys.length;
              attempts++;
            } else {
              throw new Error(`Deepgram API error: ${errText}`);
            }
          }
        } catch (fetchErr: any) {
          if (fetchErr.message.includes('Deepgram API error')) {
            throw fetchErr; // Re-throw actual API errors
          }
          lastDeepgramError = fetchErr.message;
          console.error(`Deepgram network error (fetch failed):`, fetchErr.message);
          console.warn("Shuffling to next key and retrying due to network failure...");
          currentDeepgramKeyIndex = (currentDeepgramKeyIndex + 1) % deepgramKeys.length;
          attempts++;
        }
      }

      if (!success && attempts >= deepgramKeys.length) {
        throw new Error(`Deepgram Connection Failed. Your API keys are valid, but your internet dropped the connection: ${lastDeepgramError}`);
      }
    }

    if (!transcript.trim()) {
      return NextResponse.json({ error: "No input detected." }, { status: 400 });
    }

    // Add user message to history
    history.push({ role: "user", parts: [{ text: transcript }] });

    // --- STEP 2: Gemini 2.5 Flash (The Brain) ---
    console.log("Sending to Gemini 2.5 Flash with Shuffling...");
    
    // We create a chat session. Note: @google/genai handles tools via the generateContent interface
    // But for simplicity in a stateless API, we pass the full history.
    let aiResponseText = "";
    let lastEligibilityResult: any = null;
    
    // First call to Gemini
    let response = await generateWithFallback(history);

    // Check if Gemini wants to call a tool
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      if (call.name === 'check_eligibility') {
        console.log("Gemini requested tool call:", call.args);
        
        // Execute our rules engine
        const result = await executeEligibilityCheck(call.args);
        console.log("Tool result:", result);
        
        // BUG FIX: Only show the eligibility card on the UI if it's a FINAL result. 
        // If the rules engine returns an "Error:" telling the LLM to ask for more info, do NOT show the card!
        if (!result.message.startsWith("Error:")) {
          lastEligibilityResult = result;
        }
        
        // Add model's function call and our tool response to history
        history.push({
          role: "model",
          parts: [{ functionCall: call }]
        });
        history.push({
          role: "user",
          parts: [{
            functionResponse: {
              name: call.name,
              response: result
            }
          }]
        });

        // Call Gemini again with the tool result
        response = await generateWithFallback(history);
      }
    }

    aiResponseText = response.text || "I'm sorry, I encountered an error.";
    const uiText = aiResponseText.replace(/<english>/g, '(').replace(/<\/english>/g, ')');
    const ttsText = aiResponseText.replace(/<english>[\s\S]*?<\/english>/gi, '').trim();
    console.log("Gemini Response:", uiText);
    
    // Add final AI response to history
    history.push({ role: "model", parts: [{ text: aiResponseText }] });

    // --- STEP 3: ElevenLabs Text-to-Speech ---
    console.log("Generating audio with ElevenLabs...");
    let audioBase64 = null;
    let ttsError = null;
    
    // We only generate TTS if it was a voice input (or if they explicitly want voice)
    if (audioFile) {
        const voiceId = 'EXAVITQu4vr4xnSDxMaL'; 
        let success = false;
        let attempts = 0;

        if (elevenLabsKeys.length === 0) {
          ttsError = "No ElevenLabs API keys configured.";
        }

        while (attempts < elevenLabsKeys.length && !success) {
          const key = elevenLabsKeys[currentElevenKeyIndex];
          try {
            const elevenRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                method: 'POST',
                headers: {
                'Accept': 'audio/mpeg',
                'Content-Type': 'application/json',
                'xi-api-key': key,
                'Connection': 'close'
                },
                body: JSON.stringify({
                text: ttsText,
                model_id: 'eleven_multilingual_v2',
                voice_settings: { stability: 0.5, similarity_boost: 0.75 }
                })
            });

            if (elevenRes.ok) {
                const elevenBuffer = await elevenRes.arrayBuffer();
                audioBase64 = Buffer.from(elevenBuffer).toString('base64');
                success = true;
            } else {
                const errText = await elevenRes.text();
                console.error(`ElevenLabs error with key index ${currentElevenKeyIndex}:`, errText);
                if (errText.includes('quota_exceeded') || elevenRes.status === 401 || elevenRes.status === 429 || elevenRes.status >= 500) {
                   console.warn("ElevenLabs quota/server error. Shuffling to next key...");
                   currentElevenKeyIndex = (currentElevenKeyIndex + 1) % elevenLabsKeys.length;
                   attempts++;
                } else {
                   ttsError = `ElevenLabs Error: ${errText}`;
                   break;
                }
            }
          } catch (fetchErr: any) {
             if (fetchErr.message.includes('ElevenLabs Error:')) {
               throw fetchErr; // Re-throw actual API errors
             }
             console.error(`ElevenLabs network error (fetch failed):`, fetchErr.message);
             console.warn("Shuffling to next key and retrying due to network failure...");
             currentElevenKeyIndex = (currentElevenKeyIndex + 1) % elevenLabsKeys.length;
             attempts++;
          }
        }

        if (!success && attempts >= elevenLabsKeys.length && elevenLabsKeys.length > 0) {
           ttsError = "All ElevenLabs API keys are out of quota. Please add more keys.";
        }
    }

    // --- STEP 4: Return to Client ---
    return NextResponse.json({
      transcript: transcript,
      aiText: uiText,
      audioBase64: audioBase64,
      ttsError: ttsError,
      history: history,
      eligibility: lastEligibilityResult
    });

  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import fs from 'fs';
import path from 'path';

async function generateAudio() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("No ELEVENLABS_API_KEY found");
    return;
  }

  const voiceId = 'EXAVITQu4vr4xnSDxMaL'; // Sarah
  const text = "Welcome to the Benazir Income Support Programme Voice Navigator. How would you like to communicate? Please select Voice Assistant or Text Chat. بے نظیر انکم سپورٹ پروگرام وائس نیویگیٹر میں خوش آمدید۔ آپ کس طرح بات کرنا پسند کریں گے؟ براہ کرم وائس اسسٹنٹ یا لکھ کر بات کرنے کا انتخاب کریں۔";

  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("ElevenLabs Error:", err);
      return;
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const outPath = path.join(process.cwd(), 'public', 'welcome.mp3');
    fs.writeFileSync(outPath, buffer);
    console.log("Successfully saved to", outPath);

  } catch (error) {
    console.error("Error:", error);
  }
}

generateAudio();

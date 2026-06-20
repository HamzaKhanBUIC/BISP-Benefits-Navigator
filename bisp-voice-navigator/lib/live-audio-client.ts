/**
 * components/lib/live-audio-client.ts
 *
 * Browser-side audio plumbing for talking to the proxy server.
 * - Captures mic audio, downsamples to 16kHz PCM16, base64-encodes, sends over WS.
 * - Receives 24kHz PCM16 audio chunks from the proxy and plays them back.
 *
 * NOTE the asymmetric sample rates: Gemini Live expects 16kHz input and
 * produces 24kHz output. Using the same rate for both is a common bug.
 */

const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

export class LiveAudioClient {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private processorNode: ScriptProcessorNode | null = null; // swap for AudioWorklet for production polish
  private playbackQueueTime = 0;

  constructor(private proxyUrl: string) {}

  async connect(onTranscriptOrEvent?: (msg: any) => void) {
    this.ws = new WebSocket(this.proxyUrl);

    this.ws.onopen = () => {
      console.log("[client] connected to proxy");
    };

    this.ws.onmessage = async (event) => {
      let data: any;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      // Our proxy forwards Gemini's server_content messages mostly as-is.
      if (data.type === "eligibility_result") {
        onTranscriptOrEvent?.(data);
        return;
      }

      const audioPart = data?.serverContent?.modelTurn?.parts?.find(
        (p: any) => p.inlineData?.mimeType?.startsWith("audio/")
      );
      if (audioPart?.inlineData?.data) {
        this.playAudioChunk(audioPart.inlineData.data);
      }

      const textPart = data?.serverContent?.modelTurn?.parts?.find((p: any) => p.text);
      if (textPart?.text) {
        onTranscriptOrEvent?.({ type: "transcript", text: textPart.text });
      }

      // Barge-in signal from Gemini's VAD
      if (data?.serverContent?.interrupted) {
        this.stopPlayback();
      }
    };

    this.ws.onclose = () => console.log("[client] proxy connection closed");
    this.ws.onerror = (err) => console.error("[client] proxy error:", err);

    await this.startMicCapture();
  }

  private async startMicCapture() {
    this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Single AudioContext handles both capture (resampled) and playback (24kHz).
    // Browsers pick a hardware rate for the context; we resample manually for
    // outgoing mic audio, and rely on a separate playback context for output.
    this.audioContext = new AudioContext();

    const source = this.audioContext.createMediaStreamSource(this.micStream);

    // ScriptProcessorNode is deprecated but simplest for a hackathon timeline.
    // If you have time, replace with an AudioWorkletProcessor.
    this.processorNode = this.audioContext.createScriptProcessor(4096, 1, 1);

    source.connect(this.processorNode);
    this.processorNode.connect(this.audioContext.destination);

    this.processorNode.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const resampled = this.downsampleTo16k(inputData, this.audioContext!.sampleRate);
      const pcm16 = this.floatTo16BitPCM(resampled);
      const base64 = this.arrayBufferToBase64(pcm16.buffer);

      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(
          JSON.stringify({
            realtime_input: {
              media_chunks: [
                {
                  mime_type: `audio/pcm;rate=${INPUT_SAMPLE_RATE}`,
                  data: base64,
                },
              ],
            },
          })
        );
      }
    };
  }

  private downsampleTo16k(buffer: Float32Array, originalRate: number): Float32Array {
    if (originalRate === INPUT_SAMPLE_RATE) return buffer;
    const ratio = originalRate / INPUT_SAMPLE_RATE;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      result[i] = buffer[Math.floor(i * ratio)];
    }
    return result;
  }

  private floatTo16BitPCM(float32: Float32Array): Int16Array {
    const out = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
  }

  private arrayBufferToBase64(buf: ArrayBufferLike): string {
    let binary = "";
    const bytes = new Uint8Array(buf);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  // ---- Playback (24kHz) ----

  private playbackContext: AudioContext | null = null;

  private playAudioChunk(base64Data: string) {
    if (!this.playbackContext) {
      this.playbackContext = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
      this.playbackQueueTime = this.playbackContext.currentTime;
    }

    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) float32[i] = pcm16[i] / 0x8000;

    const audioBuffer = this.playbackContext.createBuffer(1, float32.length, OUTPUT_SAMPLE_RATE);
    audioBuffer.copyToChannel(float32, 0);

    const sourceNode = this.playbackContext.createBufferSource();
    sourceNode.buffer = audioBuffer;
    sourceNode.connect(this.playbackContext.destination);

    const now = this.playbackContext.currentTime;
    const startAt = Math.max(now, this.playbackQueueTime);
    sourceNode.start(startAt);
    this.playbackQueueTime = startAt + audioBuffer.duration;
  }

  private stopPlayback() {
    // On barge-in, reset the queue time so new audio starts immediately
    // instead of waiting for already-scheduled (now-irrelevant) chunks.
    if (this.playbackContext) {
      this.playbackQueueTime = this.playbackContext.currentTime;
    }
  }

  disconnect() {
    this.processorNode?.disconnect();
    this.micStream?.getTracks().forEach((t) => t.stop());
    this.audioContext?.close();
    this.playbackContext?.close();
    this.ws?.close();
  }
}

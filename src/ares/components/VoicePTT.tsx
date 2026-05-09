/**
 * VoicePTT — push-to-talk for Houston.
 *
 * Hold the button → captures from getUserMedia, encodes 16 kHz mono PCM WAV
 * in-browser (so whisper.cpp on the backend can read it directly with no
 * ffmpeg/decoding step), POSTs to /ares/voice/houston on release, plays the
 * synthesized reply, and emits the transcript+narration to the parent (which
 * appends them to the agent log).
 *
 * Why we encode WAV client-side instead of MediaRecorder webm:
 *   - whisper.cpp's CLI takes PCM WAV. Decoding webm/ogg server-side would
 *     pull in ffmpeg, which we don't want in the airplane-mode bundle.
 *   - Tauri/WebKit's MediaRecorder support is patchy; AudioContext + a
 *     ScriptProcessor is universally available.
 *
 * Latency budget (warm pass on M3 Pro):
 *   capture ~user-controlled, ASR ~1.5s, LLM ~2.5s, TTS ~0.5s → ≤ 5s typical.
 */

import { useCallback, useEffect, useRef, useState } from "react";

const HOUSTON_URL = "http://127.0.0.1:8765/ares/voice/houston";
const TARGET_SR = 16000;

export type VoicePTTEvent = {
  transcript: string;
  narration: string;
  elapsed_breakdown?: { asr_ms: number; llm_ms: number; tts_ms: number; total_ms?: number };
  used_llm: boolean;
};

type Props = {
  /** Called when Houston returns a result; parent should append to agent log. */
  onResult: (e: VoicePTTEvent) => void;
  /** Called whenever the PTT state changes — useful for UI accents elsewhere. */
  onStateChange?: (state: PTTState) => void;
  /** Optional: greenhouse trays JSON to attach to the upload (multipart `trays_json`). */
  traysContext?: () => unknown[] | null;
  /** Optional: id of the tray the operator currently has selected on screen. */
  selectedTrayId?: () => number | null;
};

export type PTTState = "idle" | "recording" | "uploading" | "thinking" | "speaking" | "error";

export default function VoicePTT({ onResult, onStateChange, traysContext, selectedTrayId }: Props) {
  const [state, setState] = useState<PTTState>("idle");
  const [transcriptPreview, setTranscriptPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [waveform, setWaveform] = useState<number[]>(new Array(24).fill(0));

  // Recording machinery — kept in refs so re-renders don't tear them down.
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const procRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const samplesRef = useRef<Float32Array[]>([]);
  const startedAtRef = useRef<number>(0);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const setStateAnd = useCallback(
    (s: PTTState) => {
      setState(s);
      onStateChange?.(s);
    },
    [onStateChange]
  );

  // Animate waveform while recording.
  useEffect(() => {
    if (state !== "recording") return;
    const tick = () => {
      const a = analyserRef.current;
      if (a) {
        const buf = new Uint8Array(a.fftSize);
        a.getByteTimeDomainData(buf);
        const bins = 24;
        const stride = Math.floor(buf.length / bins);
        const next: number[] = [];
        for (let i = 0; i < bins; i++) {
          let peak = 0;
          for (let j = 0; j < stride; j++) {
            const v = Math.abs(buf[i * stride + j] - 128) / 128;
            if (v > peak) peak = v;
          }
          next.push(peak);
        }
        setWaveform(next);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [state]);

  // Smooth fake-waveform during upload/thinking so the UI never goes flat.
  useEffect(() => {
    if (state !== "uploading" && state !== "thinking") return;
    let t = 0;
    const id = window.setInterval(() => {
      t += 1;
      const next = new Array(24).fill(0).map((_, i) => 0.15 + 0.25 * Math.abs(Math.sin((t + i * 1.7) * 0.32)));
      setWaveform(next);
    }, 60);
    return () => window.clearInterval(id);
  }, [state]);

  const cleanupRecording = useCallback(() => {
    try {
      procRef.current?.disconnect();
      sourceRef.current?.disconnect();
      analyserRef.current?.disconnect();
    } catch {
      // No-op; nodes may already be detached.
    }
    procRef.current = null;
    sourceRef.current = null;
    analyserRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
  }, []);

  const startRecording = useCallback(async () => {
    if (state === "recording" || state === "uploading" || state === "thinking") return;
    setErrorMsg(null);
    setTranscriptPreview(null);
    samplesRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: TARGET_SR, // browsers may ignore; we resample if needed
        },
      });
      streamRef.current = stream;

      // Try to get a 16 kHz context directly so we can skip resampling.
      // Safari/WebKit often ignores the rate hint and gives 48 kHz; we
      // downsample on encode.
      let ctx: AudioContext;
      try {
        // @ts-expect-error: webkit prefix
        const Ctor: typeof AudioContext = window.AudioContext || window.webkitAudioContext;
        ctx = new Ctor({ sampleRate: TARGET_SR });
      } catch {
        // @ts-expect-error: webkit prefix fallback
        const Ctor: typeof AudioContext = window.AudioContext || window.webkitAudioContext;
        ctx = new Ctor();
      }
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      analyserRef.current = analyser;

      // ScriptProcessor is deprecated but works everywhere including WKWebView.
      // 4096 samples ≈ 256ms at 16kHz, ≈ 85ms at 48kHz — both fine for a PTT loop.
      const proc = ctx.createScriptProcessor(4096, 1, 1);
      procRef.current = proc;
      proc.onaudioprocess = (ev) => {
        const ch = ev.inputBuffer.getChannelData(0);
        // Slice copy — the underlying buffer is reused by the audio thread.
        samplesRef.current.push(new Float32Array(ch));
      };
      source.connect(proc);
      proc.connect(ctx.destination);

      startedAtRef.current = performance.now();
      setStateAnd("recording");
    } catch (e: unknown) {
      cleanupRecording();
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMsg(`mic blocked: ${msg}`);
      setStateAnd("error");
    }
  }, [cleanupRecording, setStateAnd, state]);

  const stopAndSend = useCallback(async () => {
    if (state !== "recording") return;

    const ctx = audioCtxRef.current;
    const sourceRate = ctx?.sampleRate ?? TARGET_SR;
    const samples = flattenFloat32(samplesRef.current);
    const durationMs = performance.now() - startedAtRef.current;
    cleanupRecording();

    // < 250 ms is almost certainly an accidental click. Reset silently.
    if (durationMs < 250 || samples.length < sourceRate * 0.25) {
      samplesRef.current = [];
      setStateAnd("idle");
      return;
    }

    const pcm16k = sourceRate === TARGET_SR ? samples : downsample(samples, sourceRate, TARGET_SR);
    const wavBlob = encodeWav16k(pcm16k, TARGET_SR);

    setStateAnd("uploading");

    try {
      const fd = new FormData();
      fd.append("audio", wavBlob, "ptt.wav");
      const trays = traysContext?.() ?? null;
      if (trays && Array.isArray(trays) && trays.length > 0) {
        fd.append("trays_json", JSON.stringify(trays));
      }
      const sel = selectedTrayId?.();
      if (sel != null) fd.append("selected_tray_id", String(sel));

      // Switch to "thinking" once the request is in flight (not the wire-up).
      setStateAnd("thinking");
      const resp = await fetch(HOUSTON_URL, { method: "POST", body: fd });
      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(`houston ${resp.status}: ${text.slice(0, 160)}`);
      }
      const data = (await resp.json()) as {
        transcript: string;
        narration: string;
        reply_wav_b64: string;
        elapsed_breakdown: { asr_ms: number; llm_ms: number; tts_ms: number; total_ms?: number };
        used_llm: boolean;
      };

      setTranscriptPreview(data.transcript || "(silence)");

      onResult({
        transcript: data.transcript,
        narration: data.narration,
        elapsed_breakdown: data.elapsed_breakdown,
        used_llm: data.used_llm,
      });

      // Play reply if backend produced one.
      if (data.reply_wav_b64) {
        const audio = base64ToAudio(data.reply_wav_b64);
        audioElRef.current = audio;
        setStateAnd("speaking");
        audio.onended = () => setStateAnd("idle");
        audio.onerror = () => setStateAnd("idle");
        // Fire-and-forget; failed playback returns to idle via onerror.
        audio.play().catch(() => setStateAnd("idle"));
      } else {
        setStateAnd("idle");
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setErrorMsg(msg);
      setStateAnd("error");
      // Auto-recover after a beat so the next press works.
      window.setTimeout(() => {
        setErrorMsg(null);
        setStateAnd("idle");
      }, 2500);
    }
  }, [cleanupRecording, onResult, selectedTrayId, setStateAnd, state, traysContext]);

  // Keyboard shortcut: hold Space to talk (when not focused in an input).
  useEffect(() => {
    const isTextField = (el: EventTarget | null) =>
      el instanceof HTMLElement && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);

    const down = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      if (isTextField(e.target)) return;
      e.preventDefault();
      void startRecording();
    };
    const up = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      if (isTextField(e.target)) return;
      e.preventDefault();
      void stopAndSend();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [startRecording, stopAndSend]);

  // Stop recording / playback if the component unmounts mid-call.
  useEffect(() => {
    return () => {
      cleanupRecording();
      if (audioElRef.current) {
        audioElRef.current.pause();
        audioElRef.current = null;
      }
    };
  }, [cleanupRecording]);

  const label = (() => {
    switch (state) {
      case "recording":
        return "● LISTENING — release to send";
      case "uploading":
        return "Houston listening…";
      case "thinking":
        return "Houston thinking…";
      case "speaking":
        return "Houston speaking…";
      case "error":
        return "Houston offline";
      default:
        return "HOLD TO TALK TO HOUSTON";
    }
  })();

  const accent = state === "recording" ? "#ef4444" : state === "error" ? "#f97316" : "#22d3ee";

  return (
    <div className="absolute bottom-6 left-6 z-20 flex flex-col items-start gap-2 select-none">
      {transcriptPreview && state !== "recording" && (
        <div
          className="px-3 py-2 rounded-md text-xs font-mono max-w-[320px]"
          style={{
            background: "rgba(0,0,0,0.6)",
            border: "1px solid rgba(34,211,238,0.3)",
            color: "#cbd5e1",
            backdropFilter: "blur(6px)",
          }}
        >
          <span style={{ color: "#22d3ee" }}>YOU:</span> {transcriptPreview}
        </div>
      )}
      {errorMsg && (
        <div
          className="px-3 py-2 rounded-md text-xs font-mono max-w-[320px]"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.4)",
            color: "#fca5a5",
          }}
        >
          {errorMsg}
        </div>
      )}

      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          void startRecording();
        }}
        onMouseUp={(e) => {
          e.preventDefault();
          void stopAndSend();
        }}
        onMouseLeave={() => {
          // Releasing outside the button still counts as "release".
          if (state === "recording") void stopAndSend();
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          void startRecording();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          void stopAndSend();
        }}
        disabled={state === "uploading" || state === "thinking" || state === "speaking"}
        aria-label={label}
        className="px-5 py-3 rounded-full font-mono text-sm flex items-center gap-3 transition"
        style={{
          background:
            state === "recording"
              ? "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)"
              : state === "error"
                ? "linear-gradient(135deg, #f97316 0%, #c2410c 100%)"
                : "linear-gradient(135deg, #22d3ee 0%, #0891b2 100%)",
          color: "#0a0a0a",
          boxShadow: `0 0 24px ${accent}88, 0 4px 12px rgba(0,0,0,0.4)`,
          border: `1px solid ${accent}`,
          fontWeight: 600,
          minWidth: 280,
        }}
      >
        <span aria-hidden>🎙</span>
        <span className="flex-1 text-left">{label}</span>
        <span className="flex items-end gap-[2px] h-5">
          {waveform.map((v, i) => (
            <span
              key={i}
              style={{
                display: "inline-block",
                width: 2,
                height: `${Math.max(2, Math.min(20, v * 20))}px`,
                background: "rgba(0,0,0,0.65)",
                borderRadius: 1,
                transition: "height 60ms linear",
              }}
            />
          ))}
        </span>
      </button>

      <div className="text-[10px] font-mono pl-2 opacity-70" style={{ color: "#94a3b8" }}>
        ⎵ space also works · 100% on-device · whisper.cpp + piper
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PCM helpers — kept module-local so this component is fully self-contained.
// ---------------------------------------------------------------------------

function flattenFloat32(chunks: Float32Array[]): Float32Array {
  let total = 0;
  for (const c of chunks) total += c.length;
  const out = new Float32Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

/** Naive linear-interpolation downsampler. Adequate for speech ASR; we're not
 * targeting hi-fi reproduction. */
function downsample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (toRate >= fromRate) return input;
  const ratio = fromRate / toRate;
  const outLen = Math.floor(input.length / ratio);
  const out = new Float32Array(outLen);
  let pos = 0;
  for (let i = 0; i < outLen; i++) {
    const idx = i * ratio;
    const lo = Math.floor(idx);
    const hi = Math.min(lo + 1, input.length - 1);
    const frac = idx - lo;
    out[pos++] = input[lo] * (1 - frac) + input[hi] * frac;
  }
  return out;
}

/** Encode mono float PCM into a 16-bit PCM WAV blob. */
function encodeWav16k(samples: Float32Array, sampleRate: number): Blob {
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample; // mono
  const dataSize = samples.length * bytesPerSample;
  const buf = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buf);
  let p = 0;

  const writeStr = (s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(p++, s.charCodeAt(i));
  };
  const writeU32 = (v: number) => {
    view.setUint32(p, v, true);
    p += 4;
  };
  const writeU16 = (v: number) => {
    view.setUint16(p, v, true);
    p += 2;
  };

  writeStr("RIFF");
  writeU32(36 + dataSize);
  writeStr("WAVE");
  writeStr("fmt ");
  writeU32(16); // PCM chunk size
  writeU16(1); // PCM format
  writeU16(1); // channels
  writeU32(sampleRate);
  writeU32(sampleRate * blockAlign);
  writeU16(blockAlign);
  writeU16(16); // bits per sample
  writeStr("data");
  writeU32(dataSize);

  // Float32 [-1, 1] → Int16 little-endian
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(p, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    p += 2;
  }

  return new Blob([buf], { type: "audio/wav" });
}

function base64ToAudio(b64: string): HTMLAudioElement {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const blob = new Blob([bytes], { type: "audio/wav" });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  // Revoke the blob URL once playback ends — keeps memory clean across many PTTs.
  audio.addEventListener("ended", () => URL.revokeObjectURL(url), { once: true });
  audio.addEventListener("error", () => URL.revokeObjectURL(url), { once: true });
  return audio;
}

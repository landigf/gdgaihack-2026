import { useEffect, useRef, useState } from "react";

type VoiceReply = {
  transcript: string;
  reply: string;
  asr_ms: number;
  llm_ms: number;
  tts_ms: number;
  used_llm: boolean;
  reply_wav_b64: string;
};

export type TraySnapshot = {
  id: number;
  label: string;
  species: "lettuce" | "mizuna" | "pepper" | "tomato";
  stage: number;
  ndvi?: number;
  ec?: number;
  ph?: number;
  ppfd?: number;
  moisture?: number;
  days_to_harvest?: number;
};

type Props = {
  onResult?: (reply: VoiceReply) => void;
  trays?: TraySnapshot[];
  selectedTrayId?: number;
};

export default function VoicePTT({ onResult, trays, selectedTrayId }: Props) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState<boolean | null>(null);
  const [lastTranscript, setLastTranscript] = useState<string>("");
  const [lastReply, setLastReply] = useState<VoiceReply | null>(null);
  const [error, setError] = useState<string>("");
  const [textInput, setTextInput] = useState<string>("");
  const [textBusy, setTextBusy] = useState(false);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);
  const audioElement = useRef<HTMLAudioElement | null>(null);

  // Probe whether the backend has whisper + say wired up
  useEffect(() => {
    let cancelled = false;
    fetch("http://127.0.0.1:8765/ares/voice/health")
      .then((r) => r.json())
      .then((j) => {
        if (!cancelled) setVoiceAvailable(!!j.ok);
      })
      .catch(() => !cancelled && setVoiceAvailable(false));
    return () => {
      cancelled = true;
    };
  }, []);

  async function startRecording() {
    if (recording || busy) return;
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Pick the most compatible mime type the browser advertises
      const mimeCandidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/aac",
      ];
      const mime = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || "";
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunks.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.current.push(e.data);
      };
      mr.onstop = async () => {
        const blob = new Blob(chunks.current, { type: mr.mimeType || "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        await sendBlob(blob);
      };
      mediaRecorder.current = mr;
      mr.start(50);
      setRecording(true);
    } catch (e) {
      setError(`mic error: ${(e as Error).message}`);
      setRecording(false);
    }
  }

  function stopRecording() {
    if (!recording) return;
    setRecording(false);
    try {
      mediaRecorder.current?.stop();
    } catch {
      /* ignored */
    }
  }

  async function sendBlob(blob: Blob) {
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("audio", blob, "recording.webm");
      // Ground Houston's spoken answer in the same tray data the operator sees.
      if (trays && trays.length > 0) {
        fd.append("trays_json", JSON.stringify(trays));
      }
      if (selectedTrayId !== undefined) {
        fd.append("selected_tray_id", String(selectedTrayId));
      }
      const r = await fetch("http://127.0.0.1:8765/ares/voice/houston", {
        method: "POST",
        body: fd,
      });
      if (!r.ok) throw new Error(`voice ${r.status}`);
      const reply = (await r.json()) as VoiceReply;
      setLastTranscript(reply.transcript);
      setLastReply(reply);
      onResult?.(reply);
      // Play the WAV
      if (reply.reply_wav_b64) {
        const bin = atob(reply.reply_wav_b64);
        const u8 = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        const wavBlob = new Blob([u8], { type: "audio/wav" });
        const url = URL.createObjectURL(wavBlob);
        if (!audioElement.current) audioElement.current = new Audio();
        audioElement.current.src = url;
        audioElement.current.onended = () => URL.revokeObjectURL(url);
        audioElement.current.play().catch(() => {});
      }
    } catch (e) {
      setError(`voice: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  // Keyboard support: hold Space when the button is focused
  function onKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === " " || e.code === "Space") {
      e.preventDefault();
      startRecording();
    }
  }
  function onKeyUp(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === " " || e.code === "Space") {
      e.preventDefault();
      stopRecording();
    }
  }

  // Text-input path: hits the same Houston pipeline as voice, but skips ASR.
  // Useful when (a) the demo audio is unreliable, (b) the operator wants to
  // show that Houston works regardless of speech.
  async function sendText() {
    const text = textInput.trim();
    if (!text || textBusy) return;
    setTextBusy(true);
    setError("");
    try {
      const r = await fetch("http://127.0.0.1:8765/ares/voice/houston/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          trays_json: trays && trays.length > 0 ? JSON.stringify(trays) : undefined,
          selected_tray_id: selectedTrayId,
          speak: true,
        }),
      });
      if (!r.ok) throw new Error(`text ${r.status}`);
      const reply = (await r.json()) as VoiceReply;
      setLastTranscript(reply.transcript);
      setLastReply(reply);
      onResult?.(reply);
      setTextInput("");
      if (reply.reply_wav_b64) {
        const bin = atob(reply.reply_wav_b64);
        const u8 = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        const wavBlob = new Blob([u8], { type: "audio/wav" });
        const url = URL.createObjectURL(wavBlob);
        if (!audioElement.current) audioElement.current = new Audio();
        audioElement.current.src = url;
        audioElement.current.onended = () => URL.revokeObjectURL(url);
        audioElement.current.play().catch(() => {});
      }
    } catch (e) {
      setError(`text: ${(e as Error).message}`);
    } finally {
      setTextBusy(false);
    }
  }

  function onTextKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendText();
    }
  }

  const disabled = voiceAvailable === false || busy;
  const buttonLabel = recording
    ? "🔴 RELEASE TO SEND"
    : busy
      ? "⏳ HOUSTON PROCESSING…"
      : voiceAvailable === false
        ? "🎙 VOICE OFFLINE — install missing"
        : "🎙 HOLD TO TALK TO HOUSTON";

  return (
    <div className="ares-voice absolute bottom-6 left-6 z-20 flex flex-col gap-2 max-w-sm">
      <button
        aria-label="Push to talk to Houston"
        disabled={disabled && !recording}
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onMouseLeave={recording ? stopRecording : undefined}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        tabIndex={0}
        className="ares-voice-button px-5 py-3 rounded-full font-mono text-sm flex items-center gap-2"
        style={{
          background: recording
            ? "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)"
            : disabled
              ? "rgba(60,60,60,0.6)"
              : "linear-gradient(135deg, #22d3ee 0%, #0891b2 100%)",
          color: "#0a0a0a",
          boxShadow: recording
            ? "0 0 28px rgba(239,68,68,0.6), 0 4px 12px rgba(0,0,0,0.5)"
            : "0 0 24px rgba(34,211,238,0.45), 0 4px 12px rgba(0,0,0,0.4)",
          border: recording ? "1px solid #fca5a5" : "1px solid #67e8f9",
          fontWeight: 600,
          minWidth: 280,
          justifyContent: "center",
          opacity: disabled && !recording ? 0.55 : 1,
          cursor: disabled && !recording ? "not-allowed" : "pointer",
        }}
      >
        {buttonLabel}
      </button>

      {/* Text input — same Houston pipeline as voice but skips ASR. Useful for
          the demo video when mic / STT isn't reliable. */}
      <div className="ares-voice-input-row flex items-center gap-2" style={{ minWidth: 280 }}>
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={onTextKeyDown}
          placeholder={
            textBusy
              ? "Houston is thinking…"
              : "or type a prompt to Houston…"
          }
          disabled={textBusy || busy}
          aria-label="Type a prompt to Houston"
          className="flex-1 px-3 py-2 rounded-md text-xs font-mono"
          style={{
            background: "rgba(0,0,0,0.65)",
            border: "1px solid rgba(34,211,238,0.4)",
            color: "#fafafa",
            outline: "none",
            boxShadow: textBusy
              ? "0 0 12px rgba(251,191,36,0.4)"
              : "inset 0 0 0 1px rgba(34,211,238,0.1)",
            fontSize: 12,
          }}
        />
        <button
          onClick={sendText}
          disabled={!textInput.trim() || textBusy || busy}
          className="px-3 py-2 rounded-md text-xs font-mono"
          style={{
            background:
              !textInput.trim() || textBusy || busy
                ? "rgba(60,60,60,0.6)"
                : "linear-gradient(135deg, #22d3ee 0%, #0891b2 100%)",
            color: "#0a0a0a",
            border: "1px solid #67e8f9",
            fontWeight: 600,
            cursor:
              !textInput.trim() || textBusy || busy ? "not-allowed" : "pointer",
            opacity: !textInput.trim() || textBusy || busy ? 0.55 : 1,
            minWidth: 70,
          }}
          aria-label="Send text prompt to Houston"
        >
          {textBusy ? "…" : "SEND ⏎"}
        </button>
      </div>

      {(lastTranscript || error || lastReply) && (
        <div
          className="text-xs font-mono px-3 py-2 rounded-md"
          style={{
            background: "rgba(0,0,0,0.7)",
            border: "1px solid rgba(34,211,238,0.25)",
            color: "#cbd5e1",
            maxWidth: 360,
          }}
        >
          {error && <div style={{ color: "#fca5a5" }}>⚠ {error}</div>}
          {lastTranscript && (
            <div>
              <span style={{ color: "#22d3ee" }}>YOU ▸</span> {lastTranscript}
            </div>
          )}
          {lastReply && (
            <div className="mt-1">
              <span style={{ color: "#86efac" }}>HOUSTON ▸</span> {lastReply.reply}
              <div
                className="mt-1 text-[9px] opacity-70"
                style={{ color: "#94a3b8" }}
              >
                asr {lastReply.asr_ms}ms · llm {lastReply.llm_ms}ms · tts {lastReply.tts_ms}ms
                {!lastReply.used_llm && " · FALLBACK"}
              </div>
            </div>
          )}
        </div>
      )}

      {voiceAvailable === false && (
        <div
          className="ares-voice-note text-[10px] font-mono px-3 py-2 rounded-md"
          style={{
            background: "rgba(251,191,36,0.12)",
            border: "1px solid rgba(251,191,36,0.4)",
            color: "#fbbf24",
            maxWidth: 360,
          }}
        >
          Voice unavailable. Install whisper-cpp + ggml-base.en.bin under
          ~/.local/whisper-models/. macOS `say` ships built-in.
        </div>
      )}
    </div>
  );
}

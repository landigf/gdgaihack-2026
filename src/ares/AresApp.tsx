import { useCallback, useEffect, useState } from "react";
import MarsBase, { type BuildingId } from "./3d/MarsBase";
import GreenhouseDetail, { INITIAL_TRAYS } from "./views/GreenhouseDetail";
import VoicePTT, { type VoicePTTEvent } from "./components/VoicePTT";

const SOL_NUMBER = 423;

type VoiceLogEntry = {
  t: number; // ms since epoch
  transcript: string;
  narration: string;
  asr_ms?: number;
  llm_ms?: number;
  tts_ms?: number;
  used_llm: boolean;
};

function formatBlackoutCountdown(secondsLeft: number) {
  const m = Math.max(0, Math.floor(secondsLeft / 60));
  const s = Math.max(0, secondsLeft % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function AresApp() {
  const [selected, setSelected] = useState<BuildingId | null>(null);
  const [blackoutSecondsLeft, setBlackoutSecondsLeft] = useState(5 * 60 + 42);
  const [habitatAlert, setHabitatAlert] = useState(false);
  const [greenhouseReady, setGreenhouseReady] = useState(true);
  const [ch4FillPct, setCh4FillPct] = useState(0.45);
  const [voiceLog, setVoiceLog] = useState<VoiceLogEntry[]>([]);

  // Snapshot of greenhouse trays in the backend's snake_case schema, attached
  // to every PTT round-trip so Houston can ground tray-specific questions in
  // real values rather than guessing. Frozen for the demo: trays don't drift
  // fast enough during a 30s round-trip to matter.
  const traysSnapshot = useCallback(() => {
    return INITIAL_TRAYS.map((t) => ({
      id: t.id,
      species: t.species,
      label: t.label,
      stage: t.stage,
      ndvi: t.ndvi,
      ec: t.ec,
      ph: t.ph,
      ppfd: t.ppfd,
      moisture: t.moisture,
      days_to_harvest: t.daysToHarvest,
    }));
  }, []);

  const handleVoiceResult = useCallback((e: VoicePTTEvent) => {
    setVoiceLog((prev) => {
      const next: VoiceLogEntry = {
        t: Date.now(),
        transcript: e.transcript,
        narration: e.narration,
        asr_ms: e.elapsed_breakdown?.asr_ms,
        llm_ms: e.elapsed_breakdown?.llm_ms,
        tts_ms: e.elapsed_breakdown?.tts_ms,
        used_llm: e.used_llm,
      };
      // Keep the agent log scrollable but bounded — last 8 turns is plenty.
      return [next, ...prev].slice(0, 8);
    });
  }, []);

  // Blackout timer ticks down each second
  useEffect(() => {
    const t = setInterval(() => setBlackoutSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  // Mock CH4 tank slow drift
  useEffect(() => {
    const t = setInterval(() => {
      setCh4FillPct((v) => Math.min(0.95, v + 0.005));
    }, 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      className="w-screen h-screen relative overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at 50% 30%, #2c0a0a 0%, #0a0506 70%, #050203 100%)",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#e8e8ea",
      }}
    >
      {/* Header bar */}
      <header
        className="absolute top-0 left-0 right-0 h-14 px-6 flex items-center justify-between z-20"
        style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.0) 100%)",
        }}
      >
        <div className="flex items-baseline gap-3">
          <span
            className="font-mono text-base tracking-[0.3em] font-semibold"
            style={{ color: "#22d3ee", textShadow: "0 0 12px #22d3ee55" }}
          >
            ROVER HOUSTON
          </span>
          <span className="text-xs uppercase tracking-widest" style={{ color: "#94a3b8" }}>
            Mars Habitat · Sol {SOL_NUMBER}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div
            className="px-3 py-1.5 rounded-md font-mono text-xs flex items-center gap-2"
            style={{
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.4)",
              color: "#fca5a5",
            }}
          >
            <span className="inline-block w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            COMMS BLACKOUT IN {formatBlackoutCountdown(blackoutSecondsLeft)}
          </div>
          <button
            onClick={() => {
              window.location.hash = "";
              window.location.reload();
            }}
            className="text-xs px-3 py-1.5 rounded-md"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#cbd5e1",
            }}
          >
            ← Rover Finder
          </button>
        </div>
      </header>

      {/* Side rail (right) */}
      <aside
        className="absolute top-14 right-0 bottom-0 w-[340px] z-10 p-4 flex flex-col gap-3 overflow-auto"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,4,8,0.85) 0%, rgba(20,10,15,0.7) 100%)",
          borderLeft: "1px solid rgba(34,211,238,0.15)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div>
          <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "#22d3ee" }}>
            Telemetry
          </div>
          <div className="space-y-1.5 font-mono text-xs">
            <TelemRow label="Cabin O₂" value="20.9 %" ok />
            <TelemRow label="Cabin CO₂" value="812 ppm" ok />
            <TelemRow label="Pressure" value="101.2 kPa" ok />
            <TelemRow label="Power Grid" value="42.6 kW" ok />
            <TelemRow label="Battery SoC" value="78 %" ok />
            <TelemRow label="Water Recycle" value="96 %" ok />
            <TelemRow label="Crew[0] HR" value="72 bpm" ok />
            <TelemRow label="Crew[0] SpO₂" value="98 %" ok />
          </div>
        </div>

        <div className="mt-4">
          <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "#22d3ee" }}>
            Agent Log
          </div>
          <div
            className="rounded-md p-3 text-xs font-mono space-y-3 overflow-y-auto"
            style={{
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(34,211,238,0.15)",
              minHeight: 200,
              maxHeight: 360,
            }}
          >
            {voiceLog.length === 0 && !selected && (
              <div style={{ color: "#64748b" }}>
                Houston idle. Hold the mic (or press space) and ask anything.
              </div>
            )}
            {selected && voiceLog.length === 0 && (
              <div style={{ color: "#fbbf24" }}>
                ▶ Selected: <span className="font-bold">{selected}</span>
              </div>
            )}
            {voiceLog.map((entry, idx) => {
              const total = (entry.asr_ms ?? 0) + (entry.llm_ms ?? 0) + (entry.tts_ms ?? 0);
              return (
                <div key={`${entry.t}-${idx}`} className="space-y-1 pb-2 border-b border-white/5 last:border-b-0">
                  <div style={{ color: "#22d3ee" }}>
                    YOU: <span style={{ color: "#cbd5e1" }}>{entry.transcript || "(silence)"}</span>
                  </div>
                  <div style={{ color: "#86efac" }}>
                    HOUSTON: <span style={{ color: "#e8e8ea" }}>{entry.narration}</span>
                  </div>
                  <div className="text-[10px] opacity-60" style={{ color: "#94a3b8" }}>
                    asr {entry.asr_ms ?? "?"}ms · llm {entry.llm_ms ?? "?"}ms · tts {entry.tts_ms ?? "?"}ms · total {total}ms
                    {!entry.used_llm && " · fallback"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-auto pt-3 text-[10px] tracking-wider opacity-60" style={{ color: "#94a3b8" }}>
          BUILD: ares-mars · cut-the-cord · 0 packets out
        </div>
      </aside>

      {/* 3D scene fills the remaining left space */}
      <div className="absolute top-14 left-0 right-[340px] bottom-0">
        <MarsBase
          habitatAlert={habitatAlert}
          greenhouseReady={greenhouseReady}
          ch4FillPct={ch4FillPct}
          onSelectBuilding={(id) => setSelected(id)}
          showStats
        />
      </div>

      {/* Real voice loop — whisper.cpp + Houston + Piper, all on-device.
          (setHabitatAlert is still driven by the demo controls bar below.) */}
      <VoicePTT
        onResult={handleVoiceResult}
        traysContext={traysSnapshot}
        selectedTrayId={() => (selected === "greenhouse" ? 2 : null)}
      />

      {/* Demo controls (will be removed when real sensor sim is wired) */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2 text-xs font-mono"
        style={{ color: "#94a3b8" }}
      >
        <button
          onClick={() => setHabitatAlert((v) => !v)}
          className="px-3 py-1.5 rounded-md"
          style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(239,68,68,0.4)" }}
        >
          toggle habitat alert
        </button>
        <button
          onClick={() => setGreenhouseReady((v) => !v)}
          className="px-3 py-1.5 rounded-md"
          style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(16,185,129,0.4)" }}
        >
          toggle harvest ready
        </button>
        <button
          onClick={() => setSelected("greenhouse")}
          className="px-3 py-1.5 rounded-md"
          style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(34,211,238,0.5)", color: "#22d3ee" }}
        >
          open greenhouse →
        </button>
      </div>

      {/* Greenhouse drill-in modal */}
      {selected === "greenhouse" && (
        <GreenhouseDetail onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

function TelemRow({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span style={{ color: "#94a3b8" }}>{label}</span>
      <span style={{ color: ok ? "#86efac" : "#fca5a5" }}>{value}</span>
    </div>
  );
}

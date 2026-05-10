import { useEffect, useState } from "react";
import MarsBase, { type BuildingId } from "./3d/MarsBase";
import GreenhouseDetail from "./views/GreenhouseDetail";
import InventoryDetail from "./views/InventoryDetail";
import RepairAssist from "./components/RepairAssist";
import VoicePTT, { type TraySnapshot } from "./components/VoicePTT";
import MarsLatencyChip from "./components/MarsLatencyChip";
import PerfFooter from "./components/PerfFooter";

const SOL_NUMBER = 423;

// Snapshot the voice loop sends to Houston so spoken answers are grounded
// in the same per-tray data the operator sees in the greenhouse drill-in.
// Forward-port from feat/houston-voice (PR #7): without this, "what is tray
// two doing?" gets a generic "in the corpora" answer; with it, Houston
// quotes Mizuna stage 5/5 ETA 0 sols.
const VOICE_TRAY_SNAPSHOT: TraySnapshot[] = [
  { id: 1, label: "Outredgeous lettuce", species: "lettuce", stage: 4, ndvi: 0.78, ec: 1.8, ph: 6.0, ppfd: 300, moisture: 0.61, days_to_harvest: 6 },
  { id: 2, label: "Mizuna mustard", species: "mizuna", stage: 5, ndvi: 0.81, ec: 1.9, ph: 6.3, ppfd: 295, moisture: 0.6, days_to_harvest: 0 },
  { id: 3, label: "Hatch chile pepper", species: "pepper", stage: 2, ndvi: 0.55, ec: 1.7, ph: 6.4, ppfd: 310, moisture: 0.52, days_to_harvest: 95 },
  { id: 4, label: "Red Robin tomato", species: "tomato", stage: 3, ndvi: 0.7, ec: 1.8, ph: 6.0, ppfd: 305, moisture: 0.55, days_to_harvest: 24 },
];

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
      className="ares-root w-screen h-screen relative overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at 50% 30%, #2c0a0a 0%, #0a0506 70%, #050203 100%)",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#e8e8ea",
      }}
    >
      {/* Header bar */}
      <header
        className="ares-header absolute top-0 left-0 right-0 h-14 px-6 flex items-center justify-between z-20"
        style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.0) 100%)",
        }}
      >
        <div className="ares-title flex items-baseline gap-3">
          <span
            className="ares-brand font-mono text-base tracking-[0.3em] font-semibold"
            style={{ color: "#22d3ee", textShadow: "0 0 12px #22d3ee55" }}
          >
            ROVER HOUSTON
          </span>
          <span className="ares-subtitle text-xs uppercase tracking-widest" style={{ color: "#94a3b8" }}>
            Mars Habitat · Sol {SOL_NUMBER}
          </span>
        </div>
        <div className="ares-status flex items-center gap-3">
          <MarsLatencyChip />
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
              history.replaceState(null, "", "./");
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
        className="ares-side absolute top-14 right-0 bottom-0 w-[340px] z-10 p-4 flex flex-col gap-3 overflow-auto"
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
            className="ares-agent-log rounded-md p-3 text-xs font-mono space-y-2"
            style={{
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(34,211,238,0.15)",
              minHeight: 200,
            }}
          >
            {selected ? (
              <div style={{ color: "#fbbf24" }}>
                ▶ Selected: <span className="font-bold">{selected}</span>
                <div className="mt-2 text-[11px]" style={{ color: "#94a3b8" }}>
                  (drill-in scenes coming next phase)
                </div>
              </div>
            ) : (
              <div style={{ color: "#64748b" }}>
                Houston idle. Click a building on the map to drill in.
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto pt-3">
          <PerfFooter />
        </div>
      </aside>

      {/* 3D scene fills the remaining left space */}
      <div className="ares-scene absolute top-14 left-0 right-[340px] bottom-0">
        <MarsBase
          habitatAlert={habitatAlert}
          greenhouseReady={greenhouseReady}
          ch4FillPct={ch4FillPct}
          onSelectBuilding={(id) => setSelected(id)}
          showStats={import.meta.env.DEV}
          hideHints={selected !== null}
        />
      </div>

      {/* Voice push-to-talk: real STT (whisper.cpp) + LLM + TTS (macOS say).
          Tray snapshot lets Houston ground spoken answers in real per-tray
          data (PR #7 forward-port). */}
      <VoicePTT trays={VOICE_TRAY_SNAPSHOT} selectedTrayId={2} />

      {/* Houston Repair Assist — Houston layered on Rover Core RAG: free-text
          fault → NASA-cited diagnose + on-base inventory cross-check + 3-5
          step procedure (optional spoken). Killer Practical-Utility 25% beat. */}
      <RepairAssist />

      {/* Demo controls (will be removed when real sensor sim is wired) */}
      <div
        className="ares-demo-controls absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2 text-xs font-mono"
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

      {/* Inventory drill-in modal — habitat + eclss share the same view */}
      {(selected === "habitat" || selected === "eclss") && (
        <InventoryDetail
          system={selected}
          onClose={() => setSelected(null)}
        />
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

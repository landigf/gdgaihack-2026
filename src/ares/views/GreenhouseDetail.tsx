import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stats } from "@react-three/drei";
import GreenhouseRack, { type Shelf, type PotState } from "../3d/GreenhouseRack";
import { stageName, type PlantStage, type PlantSpecies } from "../3d/PlantStages";
import type { PotColor } from "../3d/Pot";
import { tauri } from "../../tauri";
import PdfViewer from "../components/PdfViewer";

type Props = {
  onClose: () => void;
};

type Citation = {
  id: string;
  path: string;
  filename: string;
  chunk_index: number;
  excerpt?: string;
};

type HoustonReply = {
  verdict: string;
  narration: string;
  tone: "ready" | "growing" | "early" | "alert";
  citations: Citation[];
  elapsed_ms: number;
  used_llm: boolean;
  procedure?: string[];
  procedure_elapsed_ms?: number;
  procedure_kv_cache_hit?: boolean;
};

async function openCitation(c: Citation): Promise<void> {
  if (!c.path) {
    // Placeholder citation (corpus not indexed). Chip is rendered disabled,
    // but log defensively in case a click slips through.
    console.log("[citation] no path on", c.id);
    return;
  }
  try {
    await tauri.openFile(c.path);
  } catch (err) {
    // Browser dev mode (no Tauri runtime) — degrade to console.
    console.log("[citation] tauri.openFile unavailable; would open:", c.path, err);
  }
}

// Build a fake "tray" payload for the existing Houston endpoint, scoped to a single pot.
function buildTrayPayload(pot: PotState, shelf: Shelf) {
  const trayLike = {
    id: parseInt(pot.id.split(".pot")[1] ?? "1", 10) + shelf.id * 10,
    species: pot.species,
    label: `Shelf ${shelf.id} pot ${pot.id.split(".pot")[1]} ${shelf.speciesLabel}`,
    stage: pot.stage,
    ndvi: pot.ndvi,
    ec: pot.ec,
    ph: pot.ph,
    ppfd: pot.ppfd,
    moisture: pot.moisture,
    days_to_harvest: pot.daysToHarvest,
  };
  return { trays: [trayLike], selected_tray_id: trayLike.id };
}

async function callHoustonForPot(pot: PotState, shelf: Shelf): Promise<HoustonReply> {
  const resp = await fetch("http://127.0.0.1:8765/ares/houston/greenhouse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildTrayPayload(pot, shelf)),
  });
  if (!resp.ok) throw new Error(`houston ${resp.status}`);
  return (await resp.json()) as HoustonReply;
}

/**
 * Streaming variant: receives SSE events from /houston/greenhouse/stream,
 * incrementally pushes the raw streamed text into `onPartial`, and resolves
 * with the parsed final HoustonReply once the `done: true` event arrives.
 *
 * Falls back to the non-streaming endpoint if the stream errors out or the
 * browser lacks ReadableStream support — keeps the demo robust if MLX
 * misbehaves at the wrong moment.
 */
async function callHoustonForPotStream(
  pot: PotState,
  shelf: Shelf,
  onPartial: (rawText: string, ttftMs: number | null) => void,
  signal: AbortSignal
): Promise<HoustonReply> {
  const resp = await fetch("http://127.0.0.1:8765/ares/houston/greenhouse/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(buildTrayPayload(pot, shelf)),
    signal,
  });
  if (!resp.ok) throw new Error(`houston-stream ${resp.status}`);
  if (!resp.body) throw new Error("houston-stream: no response body");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let raw = "";
  let ttft: number | null = null;
  let final: HoustonReply | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    // SSE events are separated by "\n\n"
    const events = buffer.split("\n\n");
    buffer = events.pop() ?? "";
    for (const evt of events) {
      const line = evt.trim();
      if (!line.startsWith("data:")) continue;
      try {
        const obj = JSON.parse(line.slice(5).trim());
        if (typeof obj.ttft_ms === "number" && ttft === null) {
          ttft = obj.ttft_ms;
        }
        if (typeof obj.token === "string") {
          raw += obj.token;
          onPartial(raw, ttft);
        }
        if (obj.done === true) {
          final = {
            verdict: obj.verdict ?? "",
            narration: obj.narration ?? "",
            tone: obj.tone ?? "growing",
            citations: obj.citations ?? [],
            elapsed_ms: obj.elapsed_ms ?? 0,
            used_llm: !!obj.used_llm,
          };
        }
        if (obj.error) {
          throw new Error(`stream error: ${obj.error}`);
        }
      } catch {
        // Tolerate one bad event; keep reading.
      }
    }
  }

  if (!final) throw new Error("houston-stream: no done event");
  return final;
}

// ---------------------------------------------------------------------------
// Initial shelf seed — 4 species × 4 pots each
// Stages staggered within shelf to look like rolling planting cycles
// ---------------------------------------------------------------------------

function makePot(
  shelfId: number,
  potIndex: number,
  species: PlantSpecies,
  stage: PlantStage,
  potColor: PotColor,
  ndvi: number,
  ec: number,
  ph: number,
  ppfd: number,
  moisture: number,
  daysToHarvest: number
): PotState {
  return {
    id: `shelf${shelfId}.pot${potIndex}`,
    species,
    speciesLabel: speciesDisplay(species),
    potColor,
    stage,
    progressInStage: 0.4,
    ndvi,
    ec,
    ph,
    ppfd,
    moisture,
    daysToHarvest,
  };
}

function speciesDisplay(s: PlantSpecies): string {
  return s === "lettuce"
    ? "Outredgeous lettuce"
    : s === "mizuna"
      ? "Mizuna mustard"
      : s === "pepper"
        ? "Hatch chile pepper"
        : "Red Robin tomato";
}

const INITIAL_SHELVES: Shelf[] = [
  // Shelf 1 — Lettuce, rolling cycle 1→4
  {
    id: 1,
    species: "lettuce",
    speciesLabel: "Outredgeous lettuce",
    pots: [
      makePot(1, 1, "lettuce", 1, "ceramic", 0.42, 1.5, 6.1, 285, 0.6, 25),
      makePot(1, 2, "lettuce", 2, "terracotta", 0.55, 1.6, 6.0, 290, 0.58, 20),
      makePot(1, 3, "lettuce", 3, "white", 0.66, 1.7, 6.2, 295, 0.59, 14),
      makePot(1, 4, "lettuce", 4, "darkGrey", 0.74, 1.8, 6.0, 300, 0.61, 8),
    ],
  },
  // Shelf 2 — Mizuna, mostly mature, ONE READY (the WOW pot)
  {
    id: 2,
    species: "mizuna",
    speciesLabel: "Mizuna mustard",
    pots: [
      makePot(2, 1, "mizuna", 4, "white", 0.74, 1.8, 6.2, 295, 0.6, 4),
      makePot(2, 2, "mizuna", 5, "ceramic", 0.81, 1.9, 6.3, 295, 0.6, 0), // READY
      makePot(2, 3, "mizuna", 4, "cardboard", 0.76, 1.8, 6.2, 290, 0.58, 3),
      makePot(2, 4, "mizuna", 5, "ceramic", 0.79, 1.9, 6.3, 298, 0.61, 0), // READY
    ],
  },
  // Shelf 3 — Pepper, slow long cycle
  {
    id: 3,
    species: "pepper",
    speciesLabel: "Hatch chile pepper",
    pots: [
      makePot(3, 1, "pepper", 1, "cardboard", 0.45, 1.5, 6.4, 305, 0.55, 130),
      makePot(3, 2, "pepper", 2, "ceramic", 0.55, 1.7, 6.4, 310, 0.55, 110),
      makePot(3, 3, "pepper", 2, "terracotta", 0.58, 1.7, 6.3, 308, 0.54, 100),
      makePot(3, 4, "pepper", 3, "white", 0.65, 1.8, 6.2, 312, 0.56, 80),
    ],
  },
  // Shelf 4 — Tomato, mid cycle, some red fruits visible
  {
    id: 4,
    species: "tomato",
    speciesLabel: "Red Robin tomato",
    pots: [
      makePot(4, 1, "tomato", 2, "ceramic", 0.58, 1.7, 6.0, 305, 0.55, 60),
      makePot(4, 2, "tomato", 3, "white", 0.7, 1.8, 6.1, 308, 0.56, 30),
      makePot(4, 3, "tomato", 4, "cardboard", 0.78, 1.8, 6.0, 310, 0.58, 14),
      makePot(4, 4, "tomato", 3, "ceramic", 0.68, 1.7, 6.1, 305, 0.55, 36),
    ],
  },
];

// Pick a "hero" pot — the user-visible default selection
const HERO_POT_ID = "shelf2.pot2"; // first READY mizuna

const STAGE_DURATIONS_S: Record<number, number> = {
  0: 3,
  1: 5,
  2: 8,
  3: 6,
  4: 6,
};

export default function GreenhouseDetail({ onClose }: Props) {
  const [shelves, setShelves] = useState<Shelf[]>(INITIAL_SHELVES);
  const [selectedPotId, setSelectedPotId] = useState<string>(HERO_POT_ID);
  const [houstonReply, setHoustonReply] = useState<HoustonReply | null>(null);
  const [houstonBusy, setHoustonBusy] = useState(false);
  const [focusedCitation, setFocusedCitation] = useState<Citation | null>(null);
  const [pdfCitation, setPdfCitation] = useState<Citation | null>(null);
  const houstonInflight = useRef<AbortController | null>(null);
  const lastFetchKey = useRef<string>("");

  // Sensor noise + shelf-1 lettuce pot 4 auto-grows for visible motion during the demo
  useEffect(() => {
    const tick = setInterval(() => {
      setShelves((prev) =>
        prev.map((shelf) => ({
          ...shelf,
          pots: shelf.pots.map((pot) => {
            // The "growing star": shelf 1 pot 4 (lettuce stage 4 → 5 over the demo)
            if (pot.id === "shelf1.pot4") {
              const dur = STAGE_DURATIONS_S[pot.stage] ?? 6;
              const dt = 0.5 / dur;
              let p = pot.progressInStage + dt;
              let s = pot.stage;
              if (p >= 1 && pot.stage < 5) {
                s = (pot.stage + 1) as PlantStage;
                p = 0;
              }
              return {
                ...pot,
                stage: s,
                progressInStage: Math.min(1, p),
                ndvi: clamp(0.4 + s * 0.09 + Math.random() * 0.02, 0, 1),
                daysToHarvest: Math.max(0, 12 - s * 3 - Math.floor(p * 3)),
              };
            }
            // Others: sensor noise only
            return {
              ...pot,
              ndvi: clamp(pot.ndvi + (Math.random() - 0.5) * 0.008, 0.2, 0.95),
              moisture: clamp(pot.moisture + (Math.random() - 0.5) * 0.008, 0.3, 0.85),
              ppfd: Math.round(clamp(pot.ppfd + (Math.random() - 0.5) * 4, 200, 350)),
            };
          }),
        }))
      );
    }, 500);
    return () => clearInterval(tick);
  }, []);

  // Look up the selected pot + its shelf
  const { selectedPot, selectedShelf } = useMemo(() => {
    for (const sh of shelves) {
      const pot = sh.pots.find((p) => p.id === selectedPotId);
      if (pot) return { selectedPot: pot, selectedShelf: sh };
    }
    return { selectedPot: null as PotState | null, selectedShelf: null as Shelf | null };
  }, [shelves, selectedPotId]);

  // Call Houston whenever selection or stage changes (debounced).
  // Uses the streaming endpoint so the narration ribbon paints incrementally
  // while MLX decodes — drops perceived latency from ~1.8s to <400ms TTFT.
  useEffect(() => {
    if (!selectedPot || !selectedShelf) return;
    const key = `${selectedPot.id}:${selectedPot.stage}`;
    if (key === lastFetchKey.current) return;
    lastFetchKey.current = key;

    if (houstonInflight.current) houstonInflight.current.abort();
    const ctl = new AbortController();
    houstonInflight.current = ctl;
    const timer = setTimeout(async () => {
      setHoustonBusy(true);
      try {
        // Try streaming first; emit a partial reply on every token so the
        // narration ribbon shows progress immediately. The streamed JSON is
        // still incomplete at this point, so we expose the raw text in
        // narration and let the user see it grow. The final structured reply
        // (with parsed verdict/tone/citations) replaces it on the done event.
        const reply = await callHoustonForPotStream(
          selectedPot,
          selectedShelf,
          (raw, _ttft) => {
            if (ctl.signal.aborted) return;
            setHoustonReply((prev) => ({
              verdict: prev?.verdict ?? "",
              narration: raw,
              tone: prev?.tone ?? "growing",
              citations: prev?.citations ?? [],
              elapsed_ms: prev?.elapsed_ms ?? 0,
              used_llm: true,
            }));
          },
          ctl.signal
        );
        if (!ctl.signal.aborted) setHoustonReply(reply);
      } catch {
        // Streaming failed — fall back to the original non-streaming path so
        // the demo still has a narration even if SSE breaks.
        if (ctl.signal.aborted) return;
        try {
          const reply = await callHoustonForPot(selectedPot, selectedShelf);
          if (!ctl.signal.aborted) setHoustonReply(reply);
        } catch {
          if (!ctl.signal.aborted) setHoustonReply(null);
        }
      } finally {
        if (!ctl.signal.aborted) setHoustonBusy(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      ctl.abort();
    };
  }, [selectedPot, selectedShelf]);

  // Local fallback narration if Houston endpoint hasn't returned yet
  const fallbackNarration = useMemo(() => {
    if (!selectedPot) return null;
    if (selectedPot.stage === 5) {
      return {
        verdict: "HARVEST NOW",
        narration: `${selectedPot.speciesLabel} at stage 5/5. Recommend harvest now. Cite Veggie §3.4 [S2].`,
        tone: "ready" as const,
      };
    }
    if (selectedPot.stage >= 3) {
      return {
        verdict: "FLOWERING / FRUITING",
        narration: `${selectedPot.speciesLabel} entering reproductive stage. Maintain PPFD ≥280 μmol/m²/s. Cite Veggie §3.2 [S2].`,
        tone: "growing" as const,
      };
    }
    if (selectedPot.stage >= 1) {
      return {
        verdict: "VEGETATIVE",
        narration: `${selectedPot.speciesLabel} growing nominally. ETA harvest ${selectedPot.daysToHarvest} sols. Cite APH PH-04 [S3].`,
        tone: "growing" as const,
      };
    }
    return {
      verdict: "GERMINATION",
      narration: `${selectedPot.speciesLabel} in germination. Maintain substrate moisture >50%. Cite APH PH-04 [S3].`,
      tone: "early" as const,
    };
  }, [selectedPot]);

  const narration = houstonReply
    ? {
        verdict: houstonReply.verdict,
        text: houstonReply.narration,
        tone: houstonReply.tone,
      }
    : fallbackNarration
      ? {
          verdict: fallbackNarration.verdict,
          text: fallbackNarration.narration,
          tone: fallbackNarration.tone,
        }
      : null;

  return (
    <div
      className="fixed inset-0 z-50"
      style={{
        background: "radial-gradient(ellipse at center, #050708 0%, #000 80%)",
        fontFamily: "Inter, system-ui, sans-serif",
        color: "#e8e8ea",
      }}
    >
      {/* Header */}
      <header
        className="absolute top-0 left-0 right-0 h-14 px-6 flex items-center justify-between z-10"
        style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.0) 100%)",
        }}
      >
        <div className="flex items-baseline gap-3">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md text-xs font-mono"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "#cbd5e1",
            }}
          >
            ← Back to base
          </button>
          <span
            className="font-mono text-base tracking-[0.3em] font-semibold ml-2"
            style={{ color: "#10b981", textShadow: "0 0 12px #10b98155" }}
          >
            GREENHOUSE
          </span>
          <span className="text-xs uppercase tracking-widest" style={{ color: "#94a3b8" }}>
            Bioregenerative Plant Habitat · 4 shelves · 16 pots
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono" style={{ color: "#94a3b8" }}>
          <span style={{ color: "#22d3ee" }}>HOUSTON</span> ▸ greenhouse persona online
        </div>
      </header>

      {/* M8 — time-compression honesty banner */}
      <div
        className="absolute z-20 px-3 py-1.5 rounded-md font-mono text-[10px]"
        style={{
          left: "50%",
          top: 60,
          transform: "translateX(-50%)",
          background: "rgba(168,85,247,0.18)",
          border: "1px solid rgba(168,85,247,0.5)",
          color: "#c4b5fd",
          letterSpacing: 1,
          fontWeight: 600,
          backdropFilter: "blur(6px)",
        }}
      >
        DEMO MODE · plant cycles accelerated 100× (real lettuce harvest = 28 sols, here = 28 s)
      </div>

      {/* 3D Canvas */}
      <div className="absolute top-14 left-0 right-[400px] bottom-0">
        <Canvas
          shadows
          dpr={[1, 2]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          camera={{ position: [5.4, 2.8, 5.4], fov: 38 }}
        >
          <color attach="background" args={["#000"]} />
          <ambientLight intensity={0.4} color="#ddd" />
          <directionalLight
            position={[4, 8, 4]}
            intensity={1.4}
            castShadow
            color="#fff"
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          {/* purple grow-light glow from above each shelf */}
          <pointLight position={[0, 3.6, 0]} intensity={0.8} color="#a78bfa" />
          <pointLight position={[0, 1.4, 0]} intensity={0.4} color="#a78bfa" />
          <GreenhouseRack
            shelves={shelves}
            selectedPotId={selectedPotId}
            onSelectPot={setSelectedPotId}
          />
          <OrbitControls
            makeDefault
            target={[0, 1.5, 0]}
            minDistance={3}
            maxDistance={14}
            minPolarAngle={Math.PI / 8}
            maxPolarAngle={Math.PI / 2.05}
          />
          {import.meta.env.DEV && <Stats />}
        </Canvas>
      </div>

      {/* Side panel */}
      <aside
        className="absolute top-14 right-0 bottom-0 w-[400px] z-10 p-5 overflow-auto"
        style={{
          background: "linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(10,15,12,0.7) 100%)",
          borderLeft: "1px solid rgba(16,185,129,0.18)",
          backdropFilter: "blur(8px)",
        }}
      >
        {selectedPot && selectedShelf ? (
          <>
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "#10b981" }}>
              Shelf {selectedShelf.id} · pot {selectedPot.id.split(".pot")[1]}
            </div>
            <h2
              className="text-lg font-semibold mb-1"
              style={{ color: selectedPot.stage === 5 ? "#10b981" : "#fafafa" }}
            >
              {selectedPot.speciesLabel}
            </h2>
            <div className="text-xs font-mono mb-4" style={{ color: "#94a3b8" }}>
              Stage {selectedPot.stage}/5 · {stageName(selectedPot.stage)}
              {selectedPot.stage < 5 && (
                <span> · ETA harvest {selectedPot.daysToHarvest} sols</span>
              )}
              {selectedPot.stage === 5 && (
                <span style={{ color: "#10b981" }}> · READY NOW</span>
              )}
            </div>

            {/* Stage progress bar */}
            <div className="mb-5">
              <div className="text-[10px] uppercase tracking-widest mb-1.5" style={{ color: "#94a3b8" }}>
                Growth timeline
              </div>
              <div className="flex items-center gap-1">
                {["Germ", "Seed", "Veg", "Flower", "Fruit", "Ready"].map((label, i) => {
                  const reached = i <= selectedPot.stage;
                  const current = i === selectedPot.stage;
                  return (
                    <div
                      key={label}
                      className="flex-1 text-center"
                      style={{
                        padding: "6px 4px",
                        fontSize: 9,
                        background: reached
                          ? current
                            ? selectedPot.stage === 5
                              ? "#10b981"
                              : "#22d3ee"
                            : "rgba(34,211,238,0.18)"
                          : "rgba(255,255,255,0.04)",
                        color: reached ? (current ? "#0a0a0a" : "#a5f3fc") : "#475569",
                        borderRadius: 4,
                        fontWeight: current ? 700 : 500,
                        border: current ? "1px solid #fff" : "1px solid transparent",
                        textTransform: "uppercase",
                        letterSpacing: 1,
                      }}
                    >
                      {label}
                    </div>
                  );
                })}
              </div>
              {selectedPot.stage < 5 && (
                <div className="mt-1.5 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div
                    className="h-1 rounded-full"
                    style={{
                      width: `${selectedPot.progressInStage * 100}%`,
                      background: "#22d3ee",
                      transition: "width 0.5s linear",
                    }}
                  />
                </div>
              )}
            </div>

            {/* Sensor grid */}
            <div className="mb-5">
              <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "#94a3b8" }}>
                Live sensors (cameras + spectral + capacitive)
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                <Metric label="NDVI" value={selectedPot.ndvi.toFixed(2)} target=">0.65" ok={selectedPot.ndvi > 0.65} />
                <Metric label="EC" value={`${selectedPot.ec.toFixed(1)} mS/cm`} target="1.5–2.0" ok={selectedPot.ec >= 1.5 && selectedPot.ec <= 2.0} />
                <Metric label="pH" value={selectedPot.ph.toFixed(1)} target="5.8–6.5" ok={selectedPot.ph >= 5.8 && selectedPot.ph <= 6.5} />
                <Metric label="PPFD" value={`${selectedPot.ppfd} μmol/m²/s`} target="≥280" ok={selectedPot.ppfd >= 280} />
                <Metric label="Moisture" value={`${(selectedPot.moisture * 100).toFixed(0)}%`} target="50–70%" ok={selectedPot.moisture >= 0.5 && selectedPot.moisture <= 0.7} />
                <Metric label="Chamber CO₂" value="812 ppm" target="800–1200" ok={true} />
              </div>
            </div>

            {/* Houston narration */}
            {narration && (
              <div
                className="p-3 rounded-md mb-3"
                style={{
                  background:
                    narration.tone === "ready"
                      ? "rgba(16,185,129,0.12)"
                      : "rgba(34,211,238,0.08)",
                  border: `1px solid ${narration.tone === "ready" ? "#10b981" : "#22d3ee"}55`,
                }}
              >
                <div
                  className="text-[10px] uppercase tracking-widest mb-1.5 font-mono flex items-center justify-between"
                  style={{ color: narration.tone === "ready" ? "#10b981" : "#22d3ee" }}
                >
                  <span>
                    HOUSTON ▸ greenhouse persona
                    {houstonReply?.used_llm && (
                      <span style={{ color: "#86efac", marginLeft: 6 }}>● LIVE LLM</span>
                    )}
                    {houstonReply && !houstonReply.used_llm && (
                      <span style={{ color: "#fbbf24", marginLeft: 6 }}>○ FALLBACK</span>
                    )}
                  </span>
                  {houstonBusy && (
                    <span style={{ color: "#fbbf24", fontSize: 9 }} className="animate-pulse">
                      ▸ thinking…
                    </span>
                  )}
                  {houstonReply && !houstonBusy && (
                    <span style={{ color: "#94a3b8", fontSize: 9 }}>
                      {houstonReply.elapsed_ms} ms
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-mono mb-1.5" style={{ color: "#fafafa", fontWeight: 600 }}>
                  {narration.verdict}
                </div>
                <div className="text-xs leading-relaxed mb-2" style={{ color: "#cbd5e1" }}>
                  {narration.text}
                </div>
                {houstonReply?.citations && houstonReply.citations.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {houstonReply.citations.map((c) => {
                      const clickable = !!c.excerpt || !!c.path;
                      const focused = focusedCitation?.id === c.id;
                      return (
                        <button
                          key={c.id}
                          onClick={() => setFocusedCitation(c)}
                          disabled={!clickable}
                          title={
                            clickable
                              ? `View excerpt from ${c.filename} (chunk ${c.chunk_index})`
                              : "no source path (corpus not indexed)"
                          }
                          className="px-2 py-1 rounded text-[10px] font-mono"
                          style={{
                            background: focused
                              ? "rgba(34,211,238,0.28)"
                              : clickable
                                ? "rgba(34,211,238,0.14)"
                                : "rgba(255,255,255,0.04)",
                            border: `1px solid ${focused ? "#22d3ee" : clickable ? "#22d3ee66" : "rgba(255,255,255,0.1)"}`,
                            color: clickable ? "#22d3ee" : "#64748b",
                            cursor: clickable ? "pointer" : "not-allowed",
                            maxWidth: 220,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          [{c.id}] {c.filename || "—"}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Citation detail — clicking a chip pops the excerpt of
                    the actual NASA chunk that grounded Houston's answer.
                    "Open PDF" delegates to tauri.openFile so the PDF
                    opens in macOS Preview (the live-demo wow beat). */}
                {focusedCitation && (
                  <div
                    className="rounded-md p-2 mt-2"
                    style={{
                      background: "rgba(34,211,238,0.06)",
                      border: "1px solid rgba(34,211,238,0.35)",
                    }}
                  >
                    <div
                      className="flex items-center justify-between mb-1.5"
                      style={{ fontSize: 10 }}
                    >
                      <div
                        className="font-mono"
                        style={{ color: "#22d3ee", fontWeight: 600 }}
                      >
                        [{focusedCitation.id}] · {focusedCitation.filename || "source"}
                        <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                          {" "}chunk #{focusedCitation.chunk_index ?? "?"}
                        </span>
                      </div>
                      <button
                        onClick={() => setFocusedCitation(null)}
                        className="font-mono px-1.5 py-0.5 rounded"
                        style={{
                          fontSize: 9,
                          background: "rgba(255,255,255,0.05)",
                          border: "1px solid rgba(255,255,255,0.12)",
                          color: "#94a3b8",
                          cursor: "pointer",
                        }}
                        title="Close excerpt"
                      >
                        ✕
                      </button>
                    </div>
                    {focusedCitation.excerpt ? (
                      <div
                        className="font-mono leading-relaxed mb-1.5"
                        style={{
                          color: "#e2e8f0",
                          background: "rgba(0,0,0,0.45)",
                          padding: "6px 8px",
                          borderRadius: 4,
                          borderLeft: "3px solid #22d3ee",
                          maxHeight: 140,
                          overflow: "auto",
                          whiteSpace: "pre-wrap",
                          fontSize: 10,
                        }}
                      >
                        {focusedCitation.excerpt}
                      </div>
                    ) : (
                      <div
                        className="font-mono"
                        style={{
                          color: "#94a3b8",
                          fontStyle: "italic",
                          fontSize: 10,
                        }}
                      >
                        (no excerpt — backend may need a restart)
                      </div>
                    )}
                    {focusedCitation.path && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setPdfCitation(focusedCitation)}
                          className="font-mono px-2 py-1 rounded"
                          style={{
                            fontSize: 10,
                            background:
                              "linear-gradient(135deg, #fbbf24 0%, #d97706 100%)",
                            color: "#0a0a0a",
                            border: "1px solid #fde68a",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                          title={`View ${focusedCitation.filename} with the cited paragraph highlighted`}
                        >
                          📄 Open PDF · highlight cited ↗
                        </button>
                        <button
                          onClick={() => openCitation(focusedCitation)}
                          className="font-mono px-2 py-1 rounded"
                          style={{
                            fontSize: 10,
                            background: "rgba(34,211,238,0.10)",
                            color: "#22d3ee",
                            border: "1px solid rgba(34,211,238,0.5)",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                          title={`Also open ${focusedCitation.filename} in macOS Preview`}
                        >
                          macOS Preview
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* M9 — Procedure persona card (A2A chain) */}
            {houstonReply?.procedure && houstonReply.procedure.length > 0 && (
              <div
                className="p-3 rounded-md mb-3"
                style={{
                  background: "rgba(168,85,247,0.10)",
                  border: "1px solid rgba(168,85,247,0.45)",
                }}
              >
                <div
                  className="text-[10px] uppercase tracking-widest mb-2 font-mono flex items-center justify-between"
                  style={{ color: "#c4b5fd" }}
                >
                  <span>
                    HOUSTON ▸ procedure persona
                    <span
                      style={{
                        color: "#0a0a0a",
                        background: "#c4b5fd",
                        marginLeft: 6,
                        padding: "1px 5px",
                        borderRadius: 3,
                        fontWeight: 700,
                        letterSpacing: 1,
                      }}
                    >
                      A2A
                    </span>
                  </span>
                  <span style={{ color: "#94a3b8", fontSize: 9 }}>
                    {houstonReply.procedure_elapsed_ms} ms
                    {houstonReply.procedure_kv_cache_hit && (
                      <span style={{ color: "#86efac", marginLeft: 6 }}>· KV-cache hit</span>
                    )}
                  </span>
                </div>
                <ol className="text-xs space-y-1 list-none" style={{ color: "#e9d5ff" }}>
                  {houstonReply.procedure.map((step, i) => (
                    <li
                      key={i}
                      className="font-mono leading-relaxed"
                      style={{ paddingLeft: "1.4em", textIndent: "-1.4em" }}
                    >
                      {step}
                    </li>
                  ))}
                </ol>
                <div
                  className="mt-2 text-[10px] font-mono opacity-70"
                  style={{ color: "#94a3b8" }}
                >
                  Two personas, one Ollama process, byte-identical system prefix → KV cache reuse
                </div>
              </div>
            )}

            <div className="text-[10px] font-mono opacity-70" style={{ color: "#94a3b8" }}>
              Citations resolve to NASA Veggie / APH PH-04 manuals (offline corpus, indexed by Rover Core).
            </div>
          </>
        ) : (
          <div className="text-sm" style={{ color: "#64748b" }}>
            Click a pot on the rack to inspect.
          </div>
        )}

        {/* Pot quick-switch grouped by shelf */}
        <div className="mt-6 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "#94a3b8" }}>
            All pots
          </div>
          <div className="space-y-3">
            {shelves.map((sh) => (
              <div key={sh.id}>
                <div className="text-[10px] mb-1 font-mono" style={{ color: "#94a3b8" }}>
                  Shelf {sh.id} · {sh.speciesLabel}
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {sh.pots.map((p) => {
                    const isSel = p.id === selectedPotId;
                    const isReady = p.stage === 5;
                    return (
                      <button
                        key={p.id}
                        onClick={() => setSelectedPotId(p.id)}
                        title={`${p.speciesLabel} stage ${p.stage}/5${isReady ? " — READY" : ""}`}
                        className="text-[10px] font-mono py-1.5 rounded"
                        style={{
                          background: isSel
                            ? "rgba(34,211,238,0.22)"
                            : isReady
                              ? "rgba(16,185,129,0.18)"
                              : "rgba(255,255,255,0.04)",
                          border: isSel
                            ? "1px solid #22d3ee"
                            : isReady
                              ? "1px solid #10b981"
                              : "1px solid rgba(255,255,255,0.08)",
                          color: isSel ? "#fafafa" : isReady ? "#86efac" : "#cbd5e1",
                        }}
                      >
                        #{p.id.split(".pot")[1]} · {p.stage}/5{isReady ? " ●" : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Embedded PDF.js viewer for citation chips — opens above the
          drill-in modal with the cited paragraph highlighted in yellow. */}
      {pdfCitation && (
        <PdfViewer
          citation={pdfCitation}
          onClose={() => setPdfCitation(null)}
        />
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  target,
  ok,
}: {
  label: string;
  value: string;
  target: string;
  ok: boolean;
}) {
  return (
    <div
      className="rounded-md p-2"
      style={{
        background: "rgba(0,0,0,0.4)",
        border: `1px solid ${ok ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)"}`,
      }}
    >
      <div className="text-[9px] uppercase tracking-widest" style={{ color: "#94a3b8" }}>
        {label}
      </div>
      <div className="text-sm font-semibold" style={{ color: ok ? "#86efac" : "#fca5a5" }}>
        {value}
      </div>
      <div className="text-[9px] opacity-60" style={{ color: "#94a3b8" }}>
        target {target}
      </div>
    </div>
  );
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

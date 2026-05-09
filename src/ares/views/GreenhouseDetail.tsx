import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stats } from "@react-three/drei";
import GreenhouseRack, { type Tray } from "../3d/GreenhouseRack";
import { stageName, type PlantStage } from "../3d/PlantStages";

type HoustonReply = {
  verdict: string;
  narration: string;
  tone: "ready" | "growing" | "early" | "alert";
  citations: string[];
  elapsed_ms: number;
  used_llm: boolean;
};

async function callHouston(trays: Tray[], selectedTrayId: number): Promise<HoustonReply> {
  const resp = await fetch("http://127.0.0.1:8765/ares/houston/greenhouse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      trays: trays.map((t) => ({
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
      })),
      selected_tray_id: selectedTrayId,
    }),
  });
  if (!resp.ok) throw new Error(`houston ${resp.status}`);
  return (await resp.json()) as HoustonReply;
}

type Props = {
  onClose: () => void;
};

const INITIAL_TRAYS: Tray[] = [
  {
    id: 1,
    species: "lettuce",
    label: "Outredgeous lettuce",
    stage: 2,
    progressInStage: 0.4,
    ndvi: 0.62,
    ec: 1.6,
    ph: 6.1,
    ppfd: 280,
    moisture: 0.58,
    daysToHarvest: 6,
  },
  {
    id: 2,
    species: "mizuna",
    label: "Mizuna mustard",
    stage: 5,
    progressInStage: 1.0,
    ndvi: 0.81,
    ec: 1.9,
    ph: 6.3,
    ppfd: 295,
    moisture: 0.6,
    daysToHarvest: 0,
  },
  {
    id: 3,
    species: "pepper",
    label: "Hatch chile pepper 'Española'",
    stage: 2,
    progressInStage: 0.6,
    ndvi: 0.55,
    ec: 1.7,
    ph: 6.4,
    ppfd: 310,
    moisture: 0.52,
    daysToHarvest: 95,
  },
  {
    id: 4,
    species: "tomato",
    label: "Red Robin dwarf tomato",
    stage: 3,
    progressInStage: 0.3,
    ndvi: 0.7,
    ec: 1.8,
    ph: 6.0,
    ppfd: 305,
    moisture: 0.55,
    daysToHarvest: 24,
  },
];

// Compress NASA Veggie/APH timing 100x for the demo: lettuce ~28 demo-seconds total
const STAGE_DURATIONS_S: Record<number, number> = {
  0: 3, // germination
  1: 5, // seedling
  2: 8, // vegetative
  3: 6, // flowering
  4: 6, // fruiting
};

export default function GreenhouseDetail({ onClose }: Props) {
  const [trays, setTrays] = useState<Tray[]>(INITIAL_TRAYS);
  const [selectedTrayId, setSelectedTrayId] = useState<number | null>(2);
  const [houstonReply, setHoustonReply] = useState<HoustonReply | null>(null);
  const [houstonBusy, setHoustonBusy] = useState(false);
  const houstonInflight = useRef<AbortController | null>(null);
  const lastFetchKey = useRef<string>("");

  // Call Houston whenever selection or stage changes (debounced)
  useEffect(() => {
    if (selectedTrayId == null) return;
    const sel = trays.find((t) => t.id === selectedTrayId);
    if (!sel) return;
    // Re-fetch only when stage changes (or selection changes), not on every sensor noise tick
    const key = `${selectedTrayId}:${sel.stage}`;
    if (key === lastFetchKey.current) return;
    lastFetchKey.current = key;

    if (houstonInflight.current) houstonInflight.current.abort();
    const ctl = new AbortController();
    houstonInflight.current = ctl;
    const timer = setTimeout(async () => {
      setHoustonBusy(true);
      try {
        const reply = await callHouston(trays, selectedTrayId);
        if (!ctl.signal.aborted) setHoustonReply(reply);
      } catch {
        if (!ctl.signal.aborted) setHoustonReply(null);
      } finally {
        if (!ctl.signal.aborted) setHoustonBusy(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      ctl.abort();
    };
  }, [selectedTrayId, trays]);

  // Lettuce auto-advances stages over the demo for visible motion
  useEffect(() => {
    const tick = setInterval(() => {
      setTrays((prev) =>
        prev.map((t) => {
          if (t.id !== 1) {
            // mild sensor noise on others
            return {
              ...t,
              ndvi: clamp(t.ndvi + (Math.random() - 0.5) * 0.01, 0, 1),
              moisture: clamp(t.moisture + (Math.random() - 0.5) * 0.01, 0, 1),
              ppfd: Math.round(clamp(t.ppfd + (Math.random() - 0.5) * 4, 200, 350)),
            };
          }
          // Tray 1 grows
          const dur = STAGE_DURATIONS_S[t.stage] ?? 6;
          const dt = 0.5 / dur;
          let newProgress = t.progressInStage + dt;
          let newStage = t.stage;
          if (newProgress >= 1 && t.stage < 5) {
            newStage = (t.stage + 1) as PlantStage;
            newProgress = 0;
          }
          return {
            ...t,
            stage: newStage,
            progressInStage: Math.min(1, newProgress),
            ndvi: clamp(0.4 + newStage * 0.09 + Math.random() * 0.02, 0, 1),
            ec: 1.5 + newStage * 0.1 + Math.random() * 0.05,
            ph: clamp(6.0 + Math.sin(Date.now() / 20000) * 0.15, 5.5, 7.0),
            ppfd: Math.round(280 + newStage * 4 + Math.random() * 6),
            moisture: clamp(0.55 + Math.sin(Date.now() / 15000) * 0.05, 0.2, 0.85),
            daysToHarvest: Math.max(0, 28 - newStage * 5 - Math.floor(newProgress * 5)),
          };
        })
      );
    }, 500);
    return () => {
      clearInterval(tick);
    };
  }, []);

  const selected = useMemo(
    () => trays.find((t) => t.id === selectedTrayId) || null,
    [trays, selectedTrayId]
  );

  // Local fallback narration if Houston endpoint hasn't returned yet
  const fallbackNarration = useMemo(() => {
    if (!selected) return null;
    if (selected.stage === 5) {
      return {
        verdict: "READY FOR HARVEST",
        narration: `Tray ${selected.id} ${selected.label} at stage 5/5. Recommend harvest now. Cite Veggie §3.4 [S2].`,
        tone: "ready" as const,
      };
    }
    if (selected.stage >= 3) {
      return {
        verdict: "FLOWERING / FRUITING",
        narration: `${selected.label} entering reproductive stage. Maintain PPFD ≥280 μmol/m²/s. Cite Veggie §3.2 [S2].`,
        tone: "growing" as const,
      };
    }
    if (selected.stage >= 1) {
      return {
        verdict: "VEGETATIVE",
        narration: `${selected.label} growing nominally. ETA harvest ${selected.daysToHarvest} sols. Cite APH PH-04 [S3].`,
        tone: "growing" as const,
      };
    }
    return {
      verdict: "GERMINATION",
      narration: `${selected.label} in germination. Maintain substrate moisture >50%. Cite APH PH-04 [S3].`,
      tone: "early" as const,
    };
  }, [selected]);

  // Display Houston output (LLM if available, fallback otherwise)
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
            Bioregenerative Plant Habitat · 4 trays
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono" style={{ color: "#94a3b8" }}>
          <span style={{ color: "#22d3ee" }}>HOUSTON</span> ▸ greenhouse persona online
        </div>
      </header>

      {/* 3D Canvas (left/center) */}
      <div className="absolute top-14 left-0 right-[400px] bottom-0">
        <Canvas
          shadows
          dpr={[1, 2]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          camera={{ position: [3.5, 1.6, 3.5], fov: 35 }}
        >
          <color attach="background" args={["#000"]} />
          <ambientLight intensity={0.35} color="#ddd" />
          <directionalLight
            position={[3, 6, 3]}
            intensity={1.2}
            castShadow
            color="#fff"
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          {/* purple grow-light glow from above */}
          <pointLight position={[0, 2.2, 0]} intensity={0.6} color="#a78bfa" />
          <GreenhouseRack
            trays={trays}
            selectedTrayId={selectedTrayId}
            onSelectTray={setSelectedTrayId}
          />
          <OrbitControls
            makeDefault
            target={[0, 0.9, 0]}
            minDistance={2}
            maxDistance={9}
            minPolarAngle={Math.PI / 8}
            maxPolarAngle={Math.PI / 2.1}
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
        {selected ? (
          <>
            <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: "#10b981" }}>
              Tray {selected.id}
            </div>
            <h2
              className="text-lg font-semibold mb-1"
              style={{ color: selected.stage === 5 ? "#10b981" : "#fafafa" }}
            >
              {selected.label}
            </h2>
            <div className="text-xs font-mono mb-4" style={{ color: "#94a3b8" }}>
              Stage {selected.stage}/5 · {stageName(selected.stage)}
              {selected.stage < 5 && (
                <span> · ETA harvest {selected.daysToHarvest} sols</span>
              )}
              {selected.stage === 5 && (
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
                  const reached = i <= selected.stage;
                  const current = i === selected.stage;
                  return (
                    <div
                      key={label}
                      className="flex-1 text-center"
                      style={{
                        padding: "6px 4px",
                        fontSize: 9,
                        background: reached
                          ? current
                            ? selected.stage === 5
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
              {selected.stage < 5 && (
                <div className="mt-1.5 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <div
                    className="h-1 rounded-full"
                    style={{
                      width: `${selected.progressInStage * 100}%`,
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
                <Metric label="NDVI" value={selected.ndvi.toFixed(2)} target=">0.65" ok={selected.ndvi > 0.65} />
                <Metric label="EC" value={`${selected.ec.toFixed(1)} mS/cm`} target="1.5–2.0" ok={selected.ec >= 1.5 && selected.ec <= 2.0} />
                <Metric label="pH" value={selected.ph.toFixed(1)} target="5.8–6.5" ok={selected.ph >= 5.8 && selected.ph <= 6.5} />
                <Metric label="PPFD" value={`${selected.ppfd} μmol/m²/s`} target="≥280" ok={selected.ppfd >= 280} />
                <Metric label="Moisture" value={`${(selected.moisture * 100).toFixed(0)}%`} target="50–70%" ok={selected.moisture >= 0.5 && selected.moisture <= 0.7} />
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
                <div className="text-xs leading-relaxed" style={{ color: "#cbd5e1" }}>
                  {narration.text}
                </div>
              </div>
            )}

            {/* Citation */}
            <div className="text-[10px] font-mono opacity-70" style={{ color: "#94a3b8" }}>
              Citations resolve to NASA Veggie / APH PH-04 manuals (offline corpus, indexed by Rover Core).
            </div>
          </>
        ) : (
          <div className="text-sm" style={{ color: "#64748b" }}>
            Click a tray on the rack to inspect.
          </div>
        )}

        {/* Tray quick-switch */}
        <div className="mt-6 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: "#94a3b8" }}>
            All trays
          </div>
          <div className="space-y-1.5">
            {trays.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTrayId(t.id)}
                className="w-full text-left px-3 py-2 rounded-md text-xs font-mono"
                style={{
                  background:
                    t.id === selectedTrayId
                      ? "rgba(34,211,238,0.18)"
                      : "rgba(255,255,255,0.03)",
                  border: t.id === selectedTrayId ? "1px solid #22d3ee" : "1px solid rgba(255,255,255,0.08)",
                  color: t.id === selectedTrayId ? "#fafafa" : "#cbd5e1",
                }}
              >
                <div className="flex items-center justify-between">
                  <span>Tray {t.id} · {t.label}</span>
                  <span
                    style={{
                      color: t.stage === 5 ? "#10b981" : "#94a3b8",
                      fontWeight: t.stage === 5 ? 700 : 400,
                    }}
                  >
                    {t.stage}/5{t.stage === 5 ? " ●" : ""}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>
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

import { useEffect, useMemo, useRef, useState } from "react";
import { tauri } from "../../tauri";
import {
  useInventoryState,
  type HabitatSensorState,
  type InventoryState,
} from "../state/inventoryState";

type Props = {
  system: "habitat" | "eclss";
  onClose: () => void;
};

type Citation = {
  id: string;
  path?: string;
  filename?: string;
  chunk_index?: number;
};

type SurvivalReply = {
  tip: string;
  severity: "ok" | "watch" | "critical";
  citations: Citation[];
  elapsed_ms: number;
  used_llm: boolean;
};

async function callSurvival(
  inventory: InventoryState,
  sensors: HabitatSensorState,
  system: "habitat" | "eclss"
): Promise<SurvivalReply> {
  const r = await fetch("http://127.0.0.1:8765/ares/houston/survival", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ inventory, sensors, system }),
  });
  if (!r.ok) throw new Error(`survival ${r.status}`);
  return (await r.json()) as SurvivalReply;
}

async function openCitation(c: Citation): Promise<void> {
  if (!c.path) return;
  try {
    await tauri.openFile(c.path);
  } catch (err) {
    console.log("[citation] tauri.openFile unavailable:", c.path, err);
  }
}

const SYSTEM_LABEL: Record<"habitat" | "eclss", string> = {
  habitat: "HABITAT · CREW QUARTERS",
  eclss: "ECLSS · LIFE SUPPORT",
};

const SEVERITY_STYLE: Record<
  SurvivalReply["severity"],
  { label: string; color: string; bg: string; border: string }
> = {
  ok: {
    label: "● OK",
    color: "#86efac",
    bg: "rgba(16,185,129,0.10)",
    border: "rgba(16,185,129,0.45)",
  },
  watch: {
    label: "▲ WATCH",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.12)",
    border: "rgba(251,191,36,0.55)",
  },
  critical: {
    label: "✖ CRITICAL",
    color: "#fca5a5",
    bg: "rgba(239,68,68,0.14)",
    border: "rgba(239,68,68,0.55)",
  },
};

export default function InventoryDetail({ system, onClose }: Props) {
  const { inventory, sensors } = useInventoryState();
  const [reply, setReply] = useState<SurvivalReply | null>(null);
  const [busy, setBusy] = useState(false);
  const inflight = useRef<AbortController | null>(null);
  const lastKey = useRef<string>("");

  // Re-call Houston when severity-relevant fields change (debounced)
  useEffect(() => {
    const key = `${system}:${inventory.food_sols_remaining}:${Math.round(
      sensors.cabin_co2_ppm / 50
    )}:${Math.round(inventory.water_recycle_pct)}:${Math.round(
      inventory.fuel_ch4_pct
    )}`;
    if (key === lastKey.current) return;
    lastKey.current = key;
    if (inflight.current) inflight.current.abort();
    const ctl = new AbortController();
    inflight.current = ctl;
    const t = setTimeout(async () => {
      setBusy(true);
      try {
        const r = await callSurvival(inventory, sensors, system);
        if (!ctl.signal.aborted) setReply(r);
      } catch {
        if (!ctl.signal.aborted) setReply(null);
      } finally {
        if (!ctl.signal.aborted) setBusy(false);
      }
    }, 350);
    return () => {
      clearTimeout(t);
      ctl.abort();
    };
  }, [system, inventory, sensors]);

  const sevStyle = reply ? SEVERITY_STYLE[reply.severity] : SEVERITY_STYLE.ok;

  const bars = useMemo(
    () => [
      {
        label: "Food",
        value: `${inventory.food_sols_remaining}/90 sols`,
        pct: clampPct((inventory.food_sols_remaining / 90) * 100),
      },
      {
        label: "Water recycle",
        value: `${inventory.water_recycle_pct.toFixed(0)}% · ${inventory.water_liters.toFixed(0)} L`,
        pct: clampPct(((inventory.water_recycle_pct - 90) / 8) * 100),
      },
      {
        label: "Oxygen",
        value: `ISRU ${inventory.o2_kg_per_hr.toFixed(1)} kg/hr · ${inventory.o2_backup_hours.toFixed(0)}h backup`,
        pct: clampPct((inventory.o2_backup_hours / 24) * 100),
      },
      {
        label: "Fuel CH₄ (return)",
        value: `${inventory.fuel_ch4_pct.toFixed(0)}%`,
        pct: clampPct(inventory.fuel_ch4_pct),
      },
      {
        label: "Medical courses",
        value: `${inventory.medical_courses} antibiotic + 8 EVA-O₂`,
        pct: clampPct((inventory.medical_courses / 30) * 100),
      },
      {
        label: "Spare filters",
        value: `${inventory.spare_filters} ECLSS cartridges`,
        pct: clampPct((inventory.spare_filters / 12) * 100),
      },
    ],
    [inventory]
  );

  return (
    <div
      className="fixed inset-0 z-50"
      style={{
        background: "radial-gradient(ellipse at center, #0a0608 0%, #000 80%)",
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
            style={{ color: sevStyle.color, textShadow: `0 0 12px ${sevStyle.color}55` }}
          >
            {SYSTEM_LABEL[system]}
          </span>
          <span className="text-xs uppercase tracking-widest" style={{ color: "#94a3b8" }}>
            Sol 423 · 4 crew · Mission day 423
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono" style={{ color: "#94a3b8" }}>
          <span style={{ color: "#22d3ee" }}>HOUSTON</span> ▸ survival persona online
        </div>
      </header>

      {/* Content area */}
      <main className="absolute top-14 left-0 right-0 bottom-0 overflow-auto px-8 py-8">
        <div className="max-w-[1100px] mx-auto grid grid-cols-2 gap-8">
          {/* Inventory bars */}
          <section
            className="rounded-lg p-5"
            style={{
              background: "rgba(8,12,12,0.7)",
              border: "1px solid rgba(34,211,238,0.18)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div
              className="text-[10px] uppercase tracking-widest mb-3"
              style={{ color: "#22d3ee" }}
            >
              Inventory & life-support margins
            </div>
            <div className="space-y-3">
              {bars.map((b) => (
                <Bar key={b.label} label={b.label} value={b.value} pct={b.pct} />
              ))}
            </div>
          </section>

          {/* Crew + sensors */}
          <section
            className="rounded-lg p-5"
            style={{
              background: "rgba(8,12,12,0.7)",
              border: "1px solid rgba(34,211,238,0.18)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div
              className="text-[10px] uppercase tracking-widest mb-3"
              style={{ color: "#22d3ee" }}
            >
              Crew roster
            </div>
            <div className="space-y-1.5 mb-5">
              {inventory.crew.map((c) => (
                <div
                  key={c.name}
                  className="flex items-center justify-between text-xs font-mono py-1.5 px-2 rounded"
                  style={{
                    background: c.status === "NOMINAL" ? "rgba(16,185,129,0.07)" : "rgba(251,191,36,0.07)",
                  }}
                >
                  <div>
                    <div style={{ color: "#fafafa" }}>{c.name}</div>
                    <div style={{ color: "#94a3b8", fontSize: 9 }}>{c.role}</div>
                  </div>
                  <span
                    style={{
                      color: c.status === "NOMINAL" ? "#86efac" : "#fbbf24",
                      fontSize: 9,
                      letterSpacing: 1,
                    }}
                  >
                    {c.status}
                  </span>
                </div>
              ))}
            </div>

            <div
              className="text-[10px] uppercase tracking-widest mb-2"
              style={{ color: "#22d3ee" }}
            >
              Cabin sensors (live)
            </div>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <SensorCell
                label="CO₂"
                value={`${sensors.cabin_co2_ppm.toFixed(0)} ppm`}
                ok={sensors.cabin_co2_ppm < 1000}
              />
              <SensorCell
                label="Pressure"
                value={`${sensors.cabin_pressure_kpa.toFixed(1)} kPa`}
                ok
              />
              <SensorCell
                label="Radiation"
                value={`${sensors.radiation_uSv_per_hr.toFixed(2)} μSv/hr`}
                ok={sensors.radiation_uSv_per_hr < 0.8}
              />
              <SensorCell
                label="Cabin temp"
                value={`${sensors.cabin_temp_c.toFixed(1)} °C`}
                ok
              />
            </div>
          </section>

          {/* Houston survival tip — full width */}
          <section
            className="col-span-2 rounded-lg p-5"
            style={{
              background: sevStyle.bg,
              border: `1px solid ${sevStyle.border}`,
            }}
          >
            <div
              className="text-[10px] uppercase tracking-widest mb-2 font-mono flex items-center justify-between"
              style={{ color: sevStyle.color }}
            >
              <span>
                HOUSTON ▸ survival persona
                {reply?.used_llm && (
                  <span style={{ color: "#86efac", marginLeft: 8 }}>● LIVE LLM</span>
                )}
                {reply && !reply.used_llm && (
                  <span style={{ color: "#fbbf24", marginLeft: 8 }}>○ FALLBACK</span>
                )}
                <span
                  style={{
                    color: sevStyle.color,
                    marginLeft: 12,
                    fontWeight: 700,
                    letterSpacing: 1.5,
                  }}
                >
                  {sevStyle.label}
                </span>
              </span>
              {busy && (
                <span style={{ color: "#fbbf24", fontSize: 9 }} className="animate-pulse">
                  ▸ thinking…
                </span>
              )}
              {reply && !busy && (
                <span style={{ color: "#94a3b8", fontSize: 9 }}>
                  {reply.elapsed_ms} ms
                </span>
              )}
            </div>
            <div className="text-sm leading-relaxed mb-3" style={{ color: "#fafafa" }}>
              {reply?.tip ?? "Connecting to Houston…"}
            </div>
            {reply?.citations && reply.citations.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {reply.citations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => openCitation(c)}
                    disabled={!c.path}
                    className="text-[11px] font-mono px-2 py-1 rounded"
                    style={{
                      background: c.path ? "rgba(34,211,238,0.18)" : "rgba(255,255,255,0.05)",
                      border: c.path
                        ? "1px solid rgba(34,211,238,0.6)"
                        : "1px solid rgba(255,255,255,0.12)",
                      color: c.path ? "#a5f3fc" : "#94a3b8",
                      cursor: c.path ? "pointer" : "default",
                    }}
                    title={c.path || "placeholder citation (corpus not indexed)"}
                  >
                    [{c.id}] {c.filename ?? "no path"}
                  </button>
                ))}
              </div>
            )}
            <div
              className="mt-3 text-[10px] font-mono opacity-70"
              style={{ color: "#94a3b8" }}
            >
              Citations resolve to NASA-STD-3001 / HRP / ISS Medical (offline corpus, indexed by Rover Core).
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------

function Bar({ label, value, pct }: { label: string; value: string; pct: number }) {
  const color = pct > 60 ? "#10b981" : pct > 30 ? "#fbbf24" : "#ef4444";
  return (
    <div>
      <div className="flex items-center justify-between text-xs font-mono mb-1">
        <span style={{ color: "#cbd5e1" }}>{label}</span>
        <span style={{ color }}>{value}</span>
      </div>
      <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="h-2 rounded-full"
          style={{
            width: `${pct}%`,
            background: color,
            transition: "width 0.5s linear, background 0.5s",
            boxShadow: `0 0 8px ${color}55`,
          }}
        />
      </div>
    </div>
  );
}

function SensorCell({ label, value, ok }: { label: string; value: string; ok: boolean }) {
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
    </div>
  );
}

function clampPct(v: number) {
  return Math.max(0, Math.min(100, v));
}

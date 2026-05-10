import { useEffect, useRef, useState } from "react";
import { tauri } from "../../tauri";
import { useInventoryState } from "../state/inventoryState";

type Citation = {
  id: string;
  path?: string;
  filename?: string;
  chunk_index?: number;
  excerpt?: string;
};

type RepairResponse = {
  diagnosis: string;
  severity: "ok" | "watch" | "critical";
  parts_needed: string[];
  parts_missing: string[];
  steps: string[];
  citations: Citation[];
  elapsed_ms: number;
  used_llm: boolean;
  rover_search_ms: number;
  reply_wav_b64?: string | null;
  powered_by?: string;
};

const QUICK_FAULTS: { label: string; text: string }[] = [
  {
    label: "EC overdose",
    text:
      "Tray 4 EC sensor reads 4.2 mS/cm, plant wilting — suspect fertilizer overdose in the recirculating reservoir.",
  },
  {
    label: "Filter clog",
    text:
      "ECLSS CO2 scrubber output dropped to 88%, cabin CO2 climbing past 1100 ppm — replace the LiOH cartridge.",
  },
  {
    label: "EVA suit O2 leak",
    text:
      "EVA suit 2 lost 6% O2 pressure during pre-breathe — slow leak suspected in the secondary regulator quick-disconnect.",
  },
];

function severityColor(sev: RepairResponse["severity"]): string {
  if (sev === "critical") return "#ef4444";
  if (sev === "watch") return "#fbbf24";
  return "#10b981";
}

export default function RepairAssist() {
  const { inventory, sensors } = useInventoryState();
  const [open, setOpen] = useState(false);
  const [fault, setFault] = useState<string>(QUICK_FAULTS[0].text);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");
  const [resp, setResp] = useState<RepairResponse | null>(null);
  const [focusedCitation, setFocusedCitation] = useState<Citation | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);

  // Stop TTS + clear citation focus when modal closes
  useEffect(() => {
    if (!open) {
      if (audio.current) audio.current.pause();
      setFocusedCitation(null);
    }
  }, [open]);

  async function send() {
    const txt = fault.trim();
    if (!txt || busy) return;
    setBusy(true);
    setError("");
    setResp(null);
    setFocusedCitation(null);
    try {
      const r = await fetch("http://127.0.0.1:8765/ares/houston/repair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fault: txt,
          inventory,
          sensors,
          speak: true,
        }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = (await r.json()) as RepairResponse;
      setResp(data);
      if (data.reply_wav_b64) {
        const bin = atob(data.reply_wav_b64);
        const u8 = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
        const wav = new Blob([u8], { type: "audio/wav" });
        const url = URL.createObjectURL(wav);
        if (!audio.current) audio.current = new Audio();
        audio.current.src = url;
        audio.current.onended = () => URL.revokeObjectURL(url);
        audio.current.play().catch(() => {});
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function openPdfInPreview(c: Citation) {
    if (!c.path) return;
    try {
      await tauri.openFile(c.path);
    } catch {
      // Browser fallback: surface the absolute path so the operator
      // can open it manually if needed.
      console.log("[citation] tauri.openFile unavailable; path:", c.path);
    }
  }

  // Click on a chip → open the citation detail panel (excerpt + open-PDF
  // button). This is the "live demo" experience the team rehearses for the
  // jury Q&A: someone asks a question, Houston cites [S1], operator clicks
  // the chip, the audience sees the actual NASA paragraph + can drill down
  // to the full PDF.
  function focusCitation(c: Citation) {
    setFocusedCitation(c);
  }

  return (
    <>
      {/* Floating REPAIR button — bottom-right, mirror of VoicePTT */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open Houston Repair Assist"
        className="absolute bottom-6 z-20 px-5 py-3 rounded-full font-mono text-sm flex items-center gap-2"
        style={{
          right: 360, // clear the 340px side rail with a small gap
          background:
            "linear-gradient(135deg, #f97316 0%, #c2410c 100%)",
          color: "#0a0a0a",
          boxShadow:
            "0 0 24px rgba(249,115,22,0.45), 0 4px 12px rgba(0,0,0,0.4)",
          border: "1px solid #fdba74",
          fontWeight: 600,
          minWidth: 220,
          justifyContent: "center",
        }}
      >
        🛠 HOUSTON REPAIR ASSIST
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-w-2xl w-[92%] max-h-[92vh] overflow-auto rounded-xl"
            style={{
              background:
                "linear-gradient(180deg, rgba(20,12,8,0.96) 0%, rgba(12,8,8,0.98) 100%)",
              border: "1px solid rgba(249,115,22,0.5)",
              boxShadow:
                "0 0 60px rgba(249,115,22,0.25), 0 12px 32px rgba(0,0,0,0.6)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ borderBottom: "1px solid rgba(249,115,22,0.25)" }}
            >
              <div className="font-mono text-sm" style={{ color: "#fdba74" }}>
                HOUSTON REPAIR ASSIST · grounded in NASA manuals + on-base
                inventory
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-xs font-mono px-2 py-1 rounded-md"
                style={{
                  color: "#94a3b8",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.12)",
                }}
              >
                ESC
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Fault input */}
              <div>
                <div
                  className="text-[10px] uppercase tracking-widest mb-2 font-mono"
                  style={{ color: "#fdba74" }}
                >
                  Fault description
                </div>
                <textarea
                  value={fault}
                  onChange={(e) => setFault(e.target.value)}
                  rows={3}
                  disabled={busy}
                  placeholder="Describe the fault — sensor reading, leak, alarm, error code…"
                  className="w-full px-3 py-2 rounded-md text-xs font-mono"
                  style={{
                    background: "rgba(0,0,0,0.65)",
                    border: "1px solid rgba(249,115,22,0.35)",
                    color: "#fafafa",
                    outline: "none",
                    fontSize: 12,
                    resize: "vertical",
                  }}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {QUICK_FAULTS.map((q) => (
                    <button
                      key={q.label}
                      onClick={() => setFault(q.text)}
                      disabled={busy}
                      className="text-[10px] font-mono px-2 py-1 rounded-md"
                      style={{
                        background: "rgba(249,115,22,0.1)",
                        border: "1px solid rgba(249,115,22,0.4)",
                        color: "#fdba74",
                      }}
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={send}
                  disabled={busy || !fault.trim()}
                  className="px-4 py-2 rounded-md text-xs font-mono"
                  style={{
                    background: busy
                      ? "rgba(60,60,60,0.6)"
                      : "linear-gradient(135deg, #f97316 0%, #c2410c 100%)",
                    color: "#0a0a0a",
                    border: "1px solid #fdba74",
                    fontWeight: 600,
                    cursor: busy ? "not-allowed" : "pointer",
                    minWidth: 180,
                  }}
                >
                  {busy ? "HOUSTON THINKING…" : "DIAGNOSE & REPAIR ▸"}
                </button>
                <div
                  className="text-[10px] font-mono"
                  style={{ color: "#94a3b8" }}
                >
                  uses Rover Core RAG → 30 NASA PDFs · {inventory.spare_filters} spare
                  filters · {inventory.medical_courses} med kits in stock
                </div>
              </div>

              {error && (
                <div
                  className="text-xs font-mono px-3 py-2 rounded-md"
                  style={{
                    background: "rgba(239,68,68,0.12)",
                    border: "1px solid rgba(239,68,68,0.4)",
                    color: "#fca5a5",
                  }}
                >
                  ⚠ {error}
                </div>
              )}

              {/* Response card */}
              {resp && (
                <div
                  className="rounded-md p-4 space-y-3"
                  style={{
                    background: "rgba(0,0,0,0.55)",
                    border: `1px solid ${severityColor(resp.severity)}`,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-widest"
                      style={{
                        background: severityColor(resp.severity),
                        color: "#0a0a0a",
                        fontWeight: 700,
                      }}
                    >
                      {resp.severity}
                    </span>
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: "#94a3b8" }}
                    >
                      {resp.used_llm ? "● LIVE LLM" : "○ FALLBACK"} · houston {resp.elapsed_ms}ms · rover-search {resp.rover_search_ms}ms
                    </span>
                  </div>

                  <div className="font-mono text-xs leading-relaxed" style={{ color: "#fafafa" }}>
                    <span style={{ color: "#fdba74" }}>HOUSTON ▸</span>{" "}
                    {resp.diagnosis}
                  </div>

                  {(resp.parts_needed.length > 0 ||
                    resp.parts_missing.length > 0) && (
                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div>
                        <div
                          className="text-[10px] uppercase tracking-widest mb-1"
                          style={{ color: "#10b981" }}
                        >
                          Parts needed
                        </div>
                        {resp.parts_needed.length === 0 ? (
                          <div style={{ color: "#64748b" }}>(none)</div>
                        ) : (
                          <ul className="space-y-0.5">
                            {resp.parts_needed.map((p) => (
                              <li key={p} style={{ color: "#cbd5e1" }}>
                                ✓ {p}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div>
                        <div
                          className="text-[10px] uppercase tracking-widest mb-1"
                          style={{ color: "#ef4444" }}
                        >
                          Missing — reorder
                        </div>
                        {resp.parts_missing.length === 0 ? (
                          <div style={{ color: "#64748b" }}>(none)</div>
                        ) : (
                          <ul className="space-y-0.5">
                            {resp.parts_missing.map((p) => (
                              <li key={p} style={{ color: "#fca5a5" }}>
                                ✗ {p}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  )}

                  {resp.steps.length > 0 && (
                    <div>
                      <div
                        className="text-[10px] uppercase tracking-widest mb-1 font-mono"
                        style={{ color: "#22d3ee" }}
                      >
                        Repair procedure
                      </div>
                      <ol className="space-y-1 text-xs font-mono" style={{ color: "#e2e8f0" }}>
                        {resp.steps.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {resp.citations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {resp.citations.map((c) => {
                        const clickable = !!c.excerpt || !!c.path;
                        const focused = focusedCitation?.id === c.id;
                        return (
                          <button
                            key={c.id}
                            onClick={() => focusCitation(c)}
                            disabled={!clickable}
                            className="text-[10px] font-mono px-2 py-0.5 rounded"
                            style={{
                              background: focused
                                ? "rgba(34,211,238,0.25)"
                                : "rgba(34,211,238,0.1)",
                              border: `1px solid ${focused ? "#22d3ee" : "rgba(34,211,238,0.4)"}`,
                              color: clickable ? "#22d3ee" : "#64748b",
                              cursor: clickable ? "pointer" : "default",
                            }}
                            title={
                              clickable
                                ? `View excerpt from ${c.filename || "source"}`
                                : "Citation (no corpus indexed)"
                            }
                          >
                            [{c.id}] {c.filename
                              ? c.filename.replace(/\.pdf$/i, "")
                              : "no-corpus"}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Citation detail panel — shows the actual chunk text
                      from the indexed NASA PDF + an "open the full PDF in
                      Preview" button. This is the live-demo wow beat: a
                      jury question → Houston cites [S1] → operator clicks
                      the chip → audience sees the literal paragraph from
                      the manual, then opens the full file. */}
                  {focusedCitation && (
                    <div
                      className="rounded-md p-3 mt-2"
                      style={{
                        background: "rgba(34,211,238,0.06)",
                        border: "1px solid rgba(34,211,238,0.35)",
                      }}
                    >
                      <div
                        className="flex items-center justify-between mb-2"
                        style={{ fontSize: 11 }}
                      >
                        <div
                          className="font-mono"
                          style={{ color: "#22d3ee", fontWeight: 600 }}
                        >
                          [{focusedCitation.id}] ·{" "}
                          {focusedCitation.filename || "source"}{" "}
                          <span
                            style={{ color: "#94a3b8", fontWeight: 400 }}
                          >
                            chunk #{focusedCitation.chunk_index ?? "?"}
                          </span>
                        </div>
                        <button
                          onClick={() => setFocusedCitation(null)}
                          className="text-[10px] font-mono px-2 py-0.5 rounded"
                          style={{
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
                          className="font-mono text-xs leading-relaxed mb-2"
                          style={{
                            color: "#e2e8f0",
                            background: "rgba(0,0,0,0.45)",
                            padding: "8px 10px",
                            borderRadius: 4,
                            borderLeft: "3px solid #22d3ee",
                            maxHeight: 180,
                            overflow: "auto",
                            whiteSpace: "pre-wrap",
                            fontSize: 11,
                          }}
                        >
                          {focusedCitation.excerpt}
                        </div>
                      ) : (
                        <div
                          className="font-mono text-xs"
                          style={{ color: "#94a3b8", fontStyle: "italic" }}
                        >
                          (no excerpt — backend may need to be restarted to
                          surface chunk text)
                        </div>
                      )}
                      {focusedCitation.path && (
                        <button
                          onClick={() => openPdfInPreview(focusedCitation)}
                          className="text-[11px] font-mono px-3 py-1.5 rounded"
                          style={{
                            background:
                              "linear-gradient(135deg, #22d3ee 0%, #0891b2 100%)",
                            color: "#0a0a0a",
                            border: "1px solid #67e8f9",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                          title={`Open ${focusedCitation.filename} in macOS Preview`}
                        >
                          📄 Open full PDF in Preview ↗
                        </button>
                      )}
                    </div>
                  )}

                  <div
                    className="text-[9px] font-mono pt-1 border-t"
                    style={{
                      color: "#64748b",
                      borderColor: "rgba(255,255,255,0.05)",
                    }}
                  >
                    powered_by · {resp.powered_by ?? "rover-core-rag+houston-repair"}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

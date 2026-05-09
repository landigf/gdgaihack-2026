import { useEffect, useState } from "react";

type PerfSample = {
  ts: number;
  cpu_pct_total: number;
  ram_used_mb: number;
  ram_total_mb: number;
  ram_pct: number;
  sidecar_rss_mb: number;
  ollama_rss_mb: number;
  cpu_temp_c: number | null;
};

export default function PerfFooter() {
  const [perf, setPerf] = useState<PerfSample | null>(null);
  const [fps, setFps] = useState<number>(0);

  // Poll perf at 2 Hz
  useEffect(() => {
    let cancelled = false;
    const t = setInterval(async () => {
      try {
        const r = await fetch("http://127.0.0.1:8765/ares/perf");
        if (!r.ok) return;
        const j = (await r.json()) as PerfSample;
        if (!cancelled) setPerf(j);
      } catch {
        /* offline */
      }
    }, 500);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  // FPS estimate via requestAnimationFrame
  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const loop = () => {
      frames++;
      const now = performance.now();
      if (now - last >= 1000) {
        setFps(Math.round((frames * 1000) / (now - last)));
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!perf) {
    return (
      <div className="text-[10px] tracking-wider opacity-60" style={{ color: "#94a3b8" }}>
        BUILD: ares-mars · cut-the-cord · 0 packets out
      </div>
    );
  }

  return (
    <div className="text-[9px] tracking-wide font-mono leading-relaxed" style={{ color: "#94a3b8" }}>
      <div className="flex items-center justify-between mb-1">
        <span style={{ color: "#22d3ee" }}>● PERF</span>
        <span>BUILD ares-mars · 0 pkt-out</span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        <span>FPS</span>
        <span style={{ color: fps >= 45 ? "#86efac" : fps >= 30 ? "#fbbf24" : "#fca5a5" }}>
          {fps}
        </span>
        <span>CPU</span>
        <span>{perf.cpu_pct_total.toFixed(0)}%</span>
        <span>RAM</span>
        <span>
          {(perf.ram_used_mb / 1024).toFixed(1)}/{(perf.ram_total_mb / 1024).toFixed(0)} GB ·{" "}
          {perf.ram_pct.toFixed(0)}%
        </span>
        <span>Sidecar</span>
        <span>{perf.sidecar_rss_mb} MB</span>
        <span>Ollama</span>
        <span>{perf.ollama_rss_mb} MB</span>
        {perf.cpu_temp_c !== null && (
          <>
            <span>CPU °C</span>
            <span>{perf.cpu_temp_c.toFixed(0)}</span>
          </>
        )}
      </div>
    </div>
  );
}

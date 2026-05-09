import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";

type Status = "starting" | "ready" | "error";

export default function StatusBar({ info }: { info: string }) {
  const [status, setStatus] = useState<Status>("starting");

  useEffect(() => {
    const p = listen<Status>("sidecar-status", (e) => setStatus(e.payload));
    return () => {
      p.then((u) => u());
    };
  }, []);

  const dot =
    status === "ready"
      ? "bg-emerald-400"
      : status === "error"
      ? "bg-red-400"
      : "bg-amber-400 animate-pulse";

  return (
    <footer className="col-span-3 border-t border-border px-4 text-[11px] text-muted flex items-center justify-between gap-4">
      <span className="flex items-center gap-2">
        <span className={`inline-block w-2 h-2 rounded-full ${dot}`} />
        sidecar: <span className="text-text/80">{status}</span> · airplane mode ✓
      </span>
      <span className="font-mono truncate">{info}</span>
      <span className="font-mono text-muted/80">qwen3:4b · nomic-embed · faiss · tauri</span>
    </footer>
  );
}

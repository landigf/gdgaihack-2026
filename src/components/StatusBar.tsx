import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";

type Status = "starting" | "ready" | "error";

export default function StatusBar({
  info,
  indexedRoot,
}: {
  info: string;
  indexedRoot: string | null;
}) {
  const [status, setStatus] = useState<Status>("starting");

  useEffect(() => {
    const p = listen<Status>("sidecar-status", (e) => setStatus(e.payload));
    return () => {
      p.then((u) => u());
    };
  }, []);

  const dot =
    status === "ready"
      ? "bg-success"
      : status === "error"
      ? "bg-danger"
      : "bg-warning animate-pulse";

  const label =
    status === "ready"
      ? "Ready"
      : status === "error"
      ? "AI engine failed"
      : "Starting AI engine…";

  return (
    <footer className="h-7 border-t border-separator px-3 text-xs text-muted flex items-center justify-between gap-4 bg-surface/60">
      <span className="flex items-center gap-2">
        <span className={`inline-block w-2 h-2 rounded-full ${dot}`} />
        <span>{label}</span>
        {indexedRoot && (
          <>
            <span className="text-subtle">·</span>
            <span className="font-mono truncate max-w-[200px]" title={indexedRoot}>
              indexed: {indexedRoot.replace(/^\/Users\/[^/]+/, "~")}
            </span>
          </>
        )}
      </span>
      <span className="font-mono text-subtle truncate">{info}</span>
      <span className="text-subtle">100% offline · gemma3:4b · nomic-embed-text</span>
    </footer>
  );
}

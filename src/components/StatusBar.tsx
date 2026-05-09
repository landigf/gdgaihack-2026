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

  const dotColor =
    status === "ready"
      ? "bg-success"
      : status === "error"
      ? "bg-danger"
      : "bg-warning";

  const label =
    status === "ready"
      ? "Ready"
      : status === "error"
      ? "AI engine failed"
      : "Starting AI engine…";

  return (
    <footer className="h-7 px-4 text-[11px] text-muted/85 flex items-center justify-between gap-4 bg-black/4 dark:bg-white/4 backdrop-blur-md shrink-0">
      <span className="flex items-center gap-2">
        <span className="relative inline-flex">
          <span className={`w-2 h-2 rounded-full ${dotColor}`} />
          {status !== "ready" && (
            <span
              className={`absolute inset-0 w-2 h-2 rounded-full ${dotColor} opacity-60 animate-ping`}
            />
          )}
        </span>
        <span>{label}</span>
        {indexedRoot && (
          <>
            <span className="text-subtle">·</span>
            <span className="font-mono truncate max-w-[260px]" title={indexedRoot}>
              indexed: {indexedRoot.replace(/^\/Users\/[^/]+/, "~")}
            </span>
          </>
        )}
      </span>
      <span className="font-mono text-subtle truncate">{info}</span>
      <span className="text-subtle">100% offline</span>
    </footer>
  );
}

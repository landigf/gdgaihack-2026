import { useEffect, useState } from "react";
import type { IndexedRoot } from "../types";
import { api } from "../api";
import { Folder, IndexBars, OpenExt } from "./Icon";

type Props = {
  open: boolean;
  /** Path of the currently-active corpus (highlights it in the list). */
  currentRoot: string | null;
  home: string;
  onClose: () => void;
  /** Re-index the picked root (replaces the active corpus). */
  onReindex: (root: string) => void;
  /** Navigate the file browser to the picked root and close the modal. */
  onNavigate: (root: string) => void;
};

function homeRel(p: string, home: string): string {
  if (!p) return p;
  return home && p.startsWith(home) ? "~" + p.slice(home.length) : p;
}

function fmtAgo(ms: number): string {
  if (!ms) return "—";
  const diff = Date.now() - ms;
  if (diff < 0) return "just now";
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} d ago`;
  return new Date(ms).toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function IndexedFoldersModal({
  open,
  currentRoot,
  home,
  onClose,
  onReindex,
  onNavigate,
}: Props) {
  const [roots, setRoots] = useState<IndexedRoot[] | null>(null);
  const [busyForget, setBusyForget] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    setRoots(null);
    setError("");
    let cancelled = false;
    api
      .stateList()
      .then((r) => {
        if (!cancelled) setRoots(r.roots);
      })
      .catch((e) => {
        if (!cancelled) setError((e as Error).message);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function forget(root: string) {
    setBusyForget(root);
    try {
      await api.forget(root);
      setRoots((cur) => (cur ?? []).filter((r) => r.root !== root));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyForget(null);
    }
  }

  return (
    <div
      className="welcome-scrim"
      onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains("welcome-scrim")) {
          onClose();
        }
      }}
    >
      <div className="welcome" style={{ width: 620, maxWidth: "calc(100% - 48px)" }}>
        <span className="badge">
          <IndexBars /> Indexed folders
        </span>
        <h1 style={{ fontSize: 22 }}>Folders Houston has indexed</h1>
        <p className="lede" style={{ marginBottom: 14 }}>
          The first folder is the active search corpus. Older entries are kept
          so you can re-index them with one click.
        </p>

        {error && (
          <div
            style={{
              fontSize: 12,
              color: "var(--danger)",
              background: "rgba(210, 59, 42, 0.08)",
              border: "1px solid rgba(210, 59, 42, 0.25)",
              borderRadius: 6,
              padding: "8px 10px",
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}

        {roots === null && !error && (
          <div style={{ padding: "32px 0", textAlign: "center", color: "var(--muted)" }}>
            Loading…
          </div>
        )}

        {roots !== null && roots.length === 0 && (
          <div
            style={{
              padding: "28px 16px",
              textAlign: "center",
              color: "var(--muted)",
              fontSize: 13,
              border: "1px dashed var(--rule-strong)",
              borderRadius: 8,
              marginBottom: 14,
            }}
          >
            <div style={{ marginBottom: 6, color: "var(--ink-2)", fontWeight: 500 }}>
              Nothing indexed yet
            </div>
            Pick a folder in the sidebar and click "Index this folder" to
            make it searchable.
          </div>
        )}

        {roots !== null && roots.length > 0 && (
          <div className="indexed-list">
            {roots.map((r, i) => {
              const isActive = currentRoot === r.root;
              return (
                <div
                  key={r.root}
                  className={`indexed-row${isActive ? " is-active" : ""}`}
                >
                  <span className="ix-icon">
                    <Folder size={18} />
                  </span>
                  <div className="ix-body">
                    <div className="ix-name">
                      {r.root.split("/").filter(Boolean).pop() || r.root}
                      {isActive && <span className="ix-active-chip">active</span>}
                    </div>
                    <div className="ix-path mono">{homeRel(r.root, home)}</div>
                    <div className="ix-meta mono">
                      {r.files.toLocaleString()} file
                      {r.files === 1 ? "" : "s"} · {r.chunks.toLocaleString()}{" "}
                      chunk{r.chunks === 1 ? "" : "s"} · {fmtAgo(r.indexed_at_ms)}
                    </div>
                  </div>
                  <div className="ix-actions">
                    <button
                      className="btn"
                      onClick={() => {
                        onNavigate(r.root);
                        onClose();
                      }}
                      title="Open this folder in the file browser"
                    >
                      <OpenExt /> Browse
                    </button>
                    <button
                      className="btn ai"
                      onClick={() => {
                        onReindex(r.root);
                        onClose();
                      }}
                      style={{ gridColumn: "auto", height: 26, fontSize: 12 }}
                      title={
                        isActive
                          ? "Re-scan this folder to pick up new files"
                          : "Make this folder the active search corpus"
                      }
                    >
                      <IndexBars /> {isActive ? "Re-index" : "Switch"}
                    </button>
                    <button
                      className="btn"
                      onClick={() => forget(r.root)}
                      disabled={busyForget === r.root}
                      style={{
                        height: 26,
                        fontSize: 12,
                        color: "var(--danger)",
                        borderColor: "var(--rule-strong)",
                      }}
                      title="Remove this entry from the history. Doesn't delete files."
                    >
                      {busyForget === r.root ? "…" : "Forget"}
                    </button>
                  </div>
                  {i < roots.length - 1 && <div className="ix-sep" />}
                </div>
              );
            })}
          </div>
        )}

        <div className="cta" style={{ marginTop: 14 }}>
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

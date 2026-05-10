import { useState, type DragEvent as ReactDragEvent } from "react";
import {
  HomeIcon,
  Docs,
  Downloads,
  Desktop,
  Folder,
  Star,
  IndexBars,
} from "./Icon";

export type QuickItem = {
  label: string;
  path: string;
  kind: "home" | "documents" | "downloads" | "desktop" | "starred" | "custom";
};

type EngineState = "ready" | "starting" | "installing" | "error";

type Props = {
  items: QuickItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
  engineState: EngineState;
  modelGen: string;   // e.g. "gemma4 · 8.0B"
  modelEmbed: string; // e.g. "nomic-embed-text · 137M"
  indexedRoot: string | null;
  indexedFiles: number | null;
  indexBusy: boolean;
  indexProgress: number; // 0..1, indeterminate when 0
  onIndex: () => void;
  canIndex: boolean;
  /** Called when files are dropped onto a Favorites item. */
  onDropOnFavorite: (srcPaths: string[], targetPath: string) => void;
  /** Open the Indexed Folders modal. */
  onOpenIndexedFolders: () => void;
  /** Right-click on a sidebar item — only fires for kind === 'custom'. */
  onContextMenuCustomFavorite: (path: string, x: number, y: number) => void;
};

const ICONS = {
  home: HomeIcon,
  documents: Docs,
  downloads: Downloads,
  desktop: Desktop,
  starred: Star,
  custom: Folder,
};

export default function Sidebar({
  items,
  currentPath,
  onNavigate,
  engineState,
  modelGen,
  modelEmbed,
  indexedRoot,
  indexedFiles,
  indexBusy,
  indexProgress,
  onIndex,
  canIndex,
  onDropOnFavorite,
  onOpenIndexedFolders,
  onContextMenuCustomFavorite,
}: Props) {
  const [dragOver, setDragOver] = useState<string | null>(null);

  function onDragOverFav(e: ReactDragEvent, path: string) {
    if (!path) return;
    const types = e.dataTransfer.types;
    if (!types || !types.includes("application/x-houston-paths")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = e.altKey ? "copy" : "move";
    if (dragOver !== path) setDragOver(path);
  }
  function onDropFav(e: ReactDragEvent, path: string) {
    e.preventDefault();
    setDragOver(null);
    const data = e.dataTransfer.getData("application/x-houston-paths");
    if (!data) return;
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        onDropOnFavorite(parsed.filter((p) => typeof p === "string"), path);
      }
    } catch {
      /* ignore */
    }
  }
  const dotClass =
    engineState === "ready"
      ? ""
      : engineState === "error"
      ? "err"
      : "warn";
  const engineLabel =
    engineState === "ready"
      ? "AI engine ready"
      : engineState === "starting"
      ? "Starting…"
      : engineState === "installing"
      ? "Installing… (~1 min)"
      : "AI engine offline";

  return (
    <aside className="sidebar">
      <div className="sb-section">Favorites</div>
      {items.map((it) => {
        const Glyph = ICONS[it.kind];
        const selected = currentPath === it.path;
        return (
          <div
            key={it.path}
            className={`sb-item${dragOver === it.path ? " is-drag-over" : ""}`}
            aria-selected={selected}
            onClick={() => onNavigate(it.path)}
            onContextMenu={(e) => {
              if (it.kind !== "custom") return;
              e.preventDefault();
              e.stopPropagation();
              onContextMenuCustomFavorite(it.path, e.clientX, e.clientY);
            }}
            onDragOver={(e) => onDragOverFav(e, it.path)}
            onDragEnter={(e) => onDragOverFav(e, it.path)}
            onDragLeave={() => {
              if (dragOver === it.path) setDragOver(null);
            }}
            onDrop={(e) => onDropFav(e, it.path)}
          >
            <span className="gly">
              <Glyph />
            </span>
            <span>{it.label}</span>
            <span className="sb-count" />
          </div>
        );
      })}

      <div className="sb-section">
        <span>Dashboards</span>
      </div>
      <div
        className="sb-item"
        role="button"
        tabIndex={0}
        title="Open the on-device Mars Habitat AI dashboard"
        onClick={() => {
          window.location.hash = "ares";
          // Reload so main.tsx picks AresApp at the next render.
          window.location.reload();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            window.location.hash = "ares";
            window.location.reload();
          }
        }}
        style={{ cursor: "pointer" }}
      >
        <span className="gly" aria-hidden>
          🪐
        </span>
        <span>Mars Habitat</span>
        <span className="sb-count" style={{ color: "#22d3ee" }}>
          live
        </span>
      </div>

      <div className="sb-section">
        <span>Smart Search</span>
      </div>
      <div className="sb-engine">
        <div className="eng-row">
          <span className={`dot ${dotClass}`} />
          <b>{engineLabel}</b>
        </div>
        <div className="eng-meta">
          {modelGen}
          <br />
          {modelEmbed}
        </div>

        {indexBusy ? (
          <>
            <button className="index-btn indexing" disabled>
              {indexProgress > 0
                ? `Indexing… ${Math.round(indexProgress * 100)}%`
                : "Indexing…"}
            </button>
            <div className={`idx-bar ${indexProgress > 0 ? "" : "indeterminate"}`}>
              <div style={{ width: `${Math.max(8, indexProgress * 100)}%` }} />
            </div>
          </>
        ) : (
          <>
            <div className="eng-meta" style={{ marginBottom: 8 }}>
              {indexedRoot ? (
                <>
                  <b style={{ color: "var(--ink)" }}>
                    {(indexedFiles ?? 0).toLocaleString()}
                  </b>{" "}
                  file{indexedFiles === 1 ? "" : "s"} indexed
                </>
              ) : (
                "No folder indexed yet"
              )}
            </div>
            <button
              className="index-btn"
              onClick={onIndex}
              disabled={!canIndex}
              title={canIndex ? undefined : "Open a folder first"}
            >
              <IndexBars />
              {indexedRoot ? "Re-index this folder" : "Index this folder"}
            </button>
            <button
              className="ix-link"
              onClick={onOpenIndexedFolders}
              title="See all folders Houston has indexed"
            >
              View indexed folders →
            </button>
          </>
        )}
      </div>
    </aside>
  );
}

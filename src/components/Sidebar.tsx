import {
  HomeIcon,
  Docs,
  Downloads,
  Desktop,
  Star,
  IndexBars,
} from "./Icon";

export type QuickItem = {
  label: string;
  path: string;
  kind: "home" | "documents" | "downloads" | "desktop" | "starred";
};

type EngineState = "ready" | "starting" | "error";

type Props = {
  items: QuickItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
  engineState: EngineState;
  modelInfo: string; // e.g. "gemma4 · 8B" / "nomic-embed-text · 137M"
  indexedRoot: string | null;
  indexedFiles: number | null;
  indexBusy: boolean;
  indexProgress: number; // 0..1, indeterminate when 0
  onIndex: () => void;
  canIndex: boolean;
};

const ICONS = {
  home: HomeIcon,
  documents: Docs,
  downloads: Downloads,
  desktop: Desktop,
  starred: Star,
};

export default function Sidebar({
  items,
  currentPath,
  onNavigate,
  engineState,
  modelInfo,
  indexedRoot,
  indexedFiles,
  indexBusy,
  indexProgress,
  onIndex,
  canIndex,
}: Props) {
  const dotClass =
    engineState === "ready" ? "" : engineState === "starting" ? "warn" : "err";
  const engineLabel =
    engineState === "ready"
      ? "AI engine ready"
      : engineState === "starting"
      ? "Starting AI engine…"
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
            className="sb-item"
            aria-selected={selected}
            onClick={() => onNavigate(it.path)}
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
        <span>Smart Search</span>
      </div>
      <div className="sb-engine">
        <div className="eng-row">
          <span className={`dot ${dotClass}`} />
          <b>{engineLabel}</b>
        </div>
        <div className="eng-meta">{modelInfo}</div>

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
          </>
        )}
      </div>
    </aside>
  );
}

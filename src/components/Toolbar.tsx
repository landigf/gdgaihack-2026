import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUp, Compass, Search, Loader, X } from "./Icon";

type Props = {
  canBack: boolean;
  canForward: boolean;
  canUp: boolean;
  onBack: () => void;
  onForward: () => void;
  onUp: () => void;
  query: string;
  onSearch: (q: string) => void;
  onClearSearch: () => void;
  searchBusy: boolean;
  searchEnabled: boolean;
  searchHint: string;
  indexBusy: boolean;
};

const NO_DRAG = { "data-tauri-drag-region": "false" } as Record<string, string>;

export default function Toolbar({
  canBack,
  canForward,
  canUp,
  onBack,
  onForward,
  onUp,
  query,
  onSearch,
  onClearSearch,
  searchBusy,
  searchEnabled,
  searchHint,
  indexBusy,
}: Props) {
  const [draft, setDraft] = useState(query);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDraft(query);
  }, [query]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const meta = isMac ? e.metaKey : e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        if (draft) {
          setDraft("");
          onClearSearch();
        } else {
          inputRef.current?.blur();
        }
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [draft, onClearSearch]);

  function navBtn(
    label: string,
    Icon: typeof ArrowLeft,
    onClick: () => void,
    enabled: boolean
  ) {
    return (
      <button
        {...NO_DRAG}
        onClick={onClick}
        disabled={!enabled}
        title={label}
        aria-label={label}
        className="h-7 w-8 inline-flex items-center justify-center rounded-md text-muted enabled:hover:bg-black/5 dark:enabled:hover:bg-white/5 enabled:hover:text-text disabled:opacity-30 transition"
      >
        <Icon size={15} />
      </button>
    );
  }

  return (
    <header
      data-tauri-drag-region
      className="toolbar-surface h-14 px-3 flex items-center gap-3 select-none shrink-0"
    >
      {/* Spacer for traffic lights — empty drag area */}
      <div className="w-16 shrink-0" />

      {/* Logo + wordmark — drag works here (not interactive) */}
      <div className="flex items-center gap-2 pr-1 pointer-events-none">
        <Compass size={22} />
        <span className="font-display text-[15px] font-semibold tracking-tight text-text">
          Rover
        </span>
      </div>

      {/* Navigation cluster */}
      <div className="flex items-center bg-black/5 dark:bg-white/5 rounded-lg p-0.5">
        {navBtn("Back", ArrowLeft, onBack, canBack)}
        {navBtn("Forward", ArrowRight, onForward, canForward)}
        <span className="w-px h-4 bg-black/10 dark:bg-white/10 mx-0.5" />
        {navBtn("Up to parent folder", ArrowUp, onUp, canUp)}
      </div>

      {/* Spacer — empty drag area */}
      <div className="flex-1" />

      {/* Search bar */}
      <div className="relative w-[360px] shrink-0">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
          {searchBusy ? <Loader size={14} /> : <Search size={14} />}
        </span>
        <input
          {...NO_DRAG}
          ref={inputRef}
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) onSearch(draft.trim());
          }}
          placeholder={searchEnabled ? searchHint : "Index a folder to enable search"}
          disabled={!searchEnabled}
          className="w-full h-8 pl-9 pr-20 rounded-full bg-black/5 dark:bg-white/5 text-sm placeholder:text-subtle text-text focus:bg-elevated focus:shadow-[0_0_0_3px_var(--accent-soft),0_2px_8px_rgba(0,0,0,0.06)] outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {draft ? (
          <button
            {...NO_DRAG}
            onClick={() => {
              setDraft("");
              onClearSearch();
            }}
            title="Clear search (Esc)"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 inline-flex items-center justify-center rounded-full text-muted hover:bg-black/10 dark:hover:bg-white/10 transition"
          >
            <X size={12} />
          </button>
        ) : (
          <span
            className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none"
            aria-hidden
          >
            <span className="kbd">⌘</span>
            <span className="kbd">K</span>
          </span>
        )}
      </div>

      {/* Indexing progress hairline at the bottom */}
      {indexBusy && <span className="progress-hairline" />}
    </header>
  );
}

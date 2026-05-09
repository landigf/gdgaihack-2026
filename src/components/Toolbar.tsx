import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUp, Search, Loader } from "./Icon";

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
};

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
}: Props) {
  const [draft, setDraft] = useState(query);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDraft(query);
  }, [query]);

  // ⌘K shortcut to focus the search field
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
        onClick={onClick}
        disabled={!enabled}
        title={label}
        aria-label={label}
        className="h-7 w-8 inline-flex items-center justify-center rounded-md text-muted enabled:hover:bg-bg/70 enabled:hover:text-text disabled:opacity-30 transition"
      >
        <Icon size={15} />
      </button>
    );
  }

  return (
    <header
      data-tauri-drag-region
      className="vibrancy h-12 border-b border-separator px-3 flex items-center gap-2 select-none"
    >
      {/* Spacer for traffic lights */}
      <div className="w-16 shrink-0" />

      {/* Navigation cluster */}
      <div
        className="flex items-center bg-bg/50 rounded-lg p-0.5 gap-0"
        data-tauri-drag-region={false}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {navBtn("Back", ArrowLeft, onBack, canBack)}
        {navBtn("Forward", ArrowRight, onForward, canForward)}
        <span className="w-px h-4 bg-separator mx-0.5" />
        {navBtn("Up to parent folder", ArrowUp, onUp, canUp)}
      </div>

      {/* App title (centered area for drag) */}
      <div className="flex-1 text-center font-display font-semibold text-sm text-text/70 tracking-tight pointer-events-none">
        Rover
      </div>

      {/* Search bar — right side */}
      <div
        className="relative w-[320px] shrink-0"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
          {searchBusy ? <Loader size={14} /> : <Search size={14} />}
        </span>
        <input
          ref={inputRef}
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) onSearch(draft.trim());
          }}
          placeholder={searchEnabled ? searchHint : "Index a folder to enable search"}
          disabled={!searchEnabled}
          className="w-full h-8 pl-9 pr-16 rounded-lg bg-bg/70 border border-border text-sm placeholder:text-subtle text-text focus:bg-bg focus:border-accent focus:shadow-focus-ring outline-none transition disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <span
          className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none"
          aria-hidden
        >
          <span className="kbd">⌘</span>
          <span className="kbd">K</span>
        </span>
      </div>
    </header>
  );
}

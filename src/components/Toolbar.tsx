import { useEffect, useRef, useState } from "react";
import {
  Back,
  Forward,
  Up,
  ListView,
  ColumnsView,
  SearchIcon,
  CloseX,
  Spark,
} from "./Icon";

type Props = {
  canBack: boolean;
  canForward: boolean;
  canUp: boolean;
  onBack: () => void;
  onForward: () => void;
  onUp: () => void;
  query: string;
  onQueryChange: (q: string) => void;
  onClearSearch: () => void;
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
  onQueryChange,
  onClearSearch,
}: Props) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const meta = isMac ? e.metaKey : e.ctrlKey;
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="toolbar" data-tauri-drag-region>
      <div className="tb-left">
        <button
          {...NO_DRAG}
          className="tb-btn"
          disabled={!canBack}
          onClick={onBack}
          title="Back ⌘["
          aria-label="Back"
        >
          <Back />
        </button>
        <button
          {...NO_DRAG}
          className="tb-btn"
          disabled={!canForward}
          onClick={onForward}
          title="Forward ⌘]"
          aria-label="Forward"
        >
          <Forward />
        </button>
        <button
          {...NO_DRAG}
          className="tb-btn"
          disabled={!canUp}
          onClick={onUp}
          title="Enclosing folder ⌘↑"
          aria-label="Up"
        >
          <Up />
        </button>
      </div>

      <div className="tb-mid">
        <div {...NO_DRAG} className="tb-segment" role="group" aria-label="View">
          <button {...NO_DRAG} aria-pressed="true" title="List view">
            <ListView />
          </button>
          <button {...NO_DRAG} aria-pressed="false" title="Columns view (coming)">
            <ColumnsView />
          </button>
        </div>
      </div>

      <div className="tb-right">
        <label
          {...NO_DRAG}
          className={`search ${focused ? "is-focused" : ""} ${query ? "has-query" : ""}`}
        >
          <span className="icon">
            {query ? <Spark /> : <SearchIcon />}
          </span>
          <input
            {...NO_DRAG}
            ref={inputRef}
            placeholder="Search by meaning…"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && query) {
                onClearSearch();
                inputRef.current?.blur();
              }
            }}
          />
          {query ? (
            <button
              {...NO_DRAG}
              className="clear"
              onClick={() => {
                onClearSearch();
                inputRef.current?.focus();
              }}
              title="Clear"
            >
              <CloseX />
            </button>
          ) : (
            <span className="kbd">⌘K</span>
          )}
        </label>
      </div>
    </header>
  );
}

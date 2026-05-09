import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type MenuItem =
  | {
      kind: "item";
      label: string;
      shortcut?: string;
      onClick: () => void;
      disabled?: boolean;
      danger?: boolean;
    }
  | { kind: "separator" };

type Props = {
  x: number;
  y: number;
  items: MenuItem[];
  onClose: () => void;
};

export default function ContextMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x, y });

  // Close on outside click / Escape.
  useEffect(() => {
    function onAway(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    // Defer one frame so the click that opened the menu doesn't immediately close it.
    const t = window.setTimeout(() => {
      document.addEventListener("mousedown", onAway);
      document.addEventListener("keydown", onKey);
    }, 0);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("mousedown", onAway);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // After mount, nudge position so the menu stays inside the viewport.
  useLayoutEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    let nx = x;
    let ny = y;
    if (nx + rect.width > window.innerWidth - 8) {
      nx = Math.max(8, window.innerWidth - rect.width - 8);
    }
    if (ny + rect.height > window.innerHeight - 8) {
      ny = Math.max(8, window.innerHeight - rect.height - 8);
    }
    setPos({ x: nx, y: ny });
  }, [x, y]);

  return (
    <div
      ref={ref}
      className="ctx-menu"
      style={{ left: pos.x, top: pos.y }}
      role="menu"
    >
      {items.map((it, i) =>
        it.kind === "separator" ? (
          <div key={`sep-${i}`} className="ctx-sep" />
        ) : (
          <button
            key={`it-${i}-${it.label}`}
            className={`ctx-item${it.danger ? " is-danger" : ""}`}
            disabled={it.disabled}
            onClick={() => {
              if (it.disabled) return;
              it.onClick();
              onClose();
            }}
            role="menuitem"
          >
            <span>{it.label}</span>
            {it.shortcut && <span className="ctx-shortcut">{it.shortcut}</span>}
          </button>
        )
      )}
    </div>
  );
}

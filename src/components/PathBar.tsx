type Props = {
  path: string;
  home: string;
  onNavigate: (path: string) => void;
};

function segments(path: string, home: string): { label: string; full: string }[] {
  const rel = path.startsWith(home) ? "~" + path.slice(home.length) : path;
  const parts = rel.split("/").filter(Boolean);
  // Reconstruct full paths walking forward
  const out: { label: string; full: string }[] = [];
  let acc = path.startsWith("/") ? "" : "";
  if (rel.startsWith("~")) {
    out.push({ label: "~", full: home });
    parts.shift();
    acc = home;
  } else {
    out.push({ label: "/", full: "/" });
    acc = "";
  }
  for (const p of parts) {
    acc = `${acc}/${p}`;
    out.push({ label: p, full: acc });
  }
  return out;
}

export default function PathBar({ path, home, onNavigate }: Props) {
  const segs = segments(path, home);
  const parent = segs.length > 1 ? segs[segs.length - 2].full : null;

  return (
    <div className="flex items-center gap-1 text-xs font-mono">
      <button
        onClick={() => parent && onNavigate(parent)}
        disabled={!parent}
        title="Up to parent"
        className="px-2 py-1 border border-border rounded hover:border-accent transition disabled:opacity-30 disabled:cursor-not-allowed"
      >
        ↑
      </button>
      <button
        onClick={() => onNavigate(home)}
        title="Home"
        className="px-2 py-1 border border-border rounded hover:border-accent transition"
      >
        ⌂
      </button>
      <div className="ml-2 flex items-center gap-1 overflow-x-auto whitespace-nowrap min-w-0">
        {segs.map((s, i) => (
          <span key={s.full} className="flex items-center gap-1 shrink-0">
            {i > 0 && <span className="text-muted">/</span>}
            <button
              onClick={() => onNavigate(s.full)}
              className={`px-1.5 py-0.5 rounded hover:bg-border transition ${
                i === segs.length - 1 ? "text-accent" : "text-muted hover:text-text"
              }`}
            >
              {s.label}
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

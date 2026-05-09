import { ChevronRight, Home } from "./Icon";

type Props = {
  path: string;
  home: string;
  onNavigate: (path: string) => void;
};

function buildSegments(path: string, home: string) {
  const out: { label: string; full: string; isHome?: boolean }[] = [];
  if (path.startsWith(home) && home) {
    out.push({ label: "Home", full: home, isHome: true });
    const rest = path.slice(home.length).split("/").filter(Boolean);
    let acc = home;
    for (const p of rest) {
      acc = `${acc}/${p}`;
      out.push({ label: p, full: acc });
    }
  } else {
    out.push({ label: "/", full: "/" });
    const rest = path.split("/").filter(Boolean);
    let acc = "";
    for (const p of rest) {
      acc = `${acc}/${p}`;
      out.push({ label: p, full: acc });
    }
  }
  return out;
}

export default function Breadcrumbs({ path, home, onNavigate }: Props) {
  if (!path) return null;
  const segs = buildSegments(path, home);
  return (
    <nav
      className="flex items-center gap-0.5 text-sm overflow-x-auto whitespace-nowrap min-w-0"
      aria-label="Folder path"
    >
      {segs.map((s, i) => {
        const last = i === segs.length - 1;
        return (
          <span key={s.full} className="inline-flex items-center gap-0.5 shrink-0">
            {i > 0 && <ChevronRight size={12} className="text-subtle mx-0.5" />}
            <button
              onClick={() => onNavigate(s.full)}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg transition ${
                last
                  ? "text-text font-semibold"
                  : "text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/5"
              }`}
              title={s.full}
            >
              {s.isHome && <Home size={13} />}
              <span>{s.label}</span>
            </button>
          </span>
        );
      })}
    </nav>
  );
}

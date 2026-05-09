type Props = {
  path: string;
  home: string;
  onNavigate: (path: string) => void;
};

function buildSegments(path: string, home: string) {
  const out: { label: string; full: string }[] = [];
  if (path.startsWith(home) && home) {
    out.push({ label: "Home", full: home });
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
    <div className="path">
      {segs.map((s, i) => {
        const last = i === segs.length - 1;
        return (
          <span key={s.full} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
            <button className={last ? "last" : ""} onClick={() => onNavigate(s.full)}>
              {s.label}
            </button>
            {!last && <span className="sep">›</span>}
          </span>
        );
      })}
    </div>
  );
}

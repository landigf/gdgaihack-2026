/* Houston icons — SF Symbols-ish line set, 1:1 from the Claude Design handoff. */

type IconProps = { size?: number; className?: string };

const stroke = (path: string, width = 1.4) =>
  function StrokeIcon({ size = 16, className }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
      >
        <path d={path} />
      </svg>
    );
  };

const fill = (path: string) =>
  function FillIcon({ size = 16, className }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="currentColor"
        className={className}
      >
        <path d={path} />
      </svg>
    );
  };

export const Back = stroke("M10 3L5 8l5 5", 1.6);
export const Forward = stroke("M6 3l5 5-5 5", 1.6);
export const Up = stroke("M3 9l5-5 5 5M8 4v9", 1.6);

export const ListView = stroke("M2 4h12M2 8h12M2 12h12", 1.5);

export function ColumnsView({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
      <rect x="2" y="3" width="3.5" height="10" rx="0.5" />
      <rect x="6.25" y="3" width="3.5" height="10" rx="0.5" />
      <rect x="10.5" y="3" width="3.5" height="10" rx="0.5" />
    </svg>
  );
}

export function SearchIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" className={className}>
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L14 14" />
    </svg>
  );
}

export function CloseX({ size = 10, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" className={className}>
      <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

export const Spark = fill(
  "M8 1.5l1.4 4.1 4.1 1.4-4.1 1.4L8 12.5l-1.4-4.1-4.1-1.4 4.1-1.4L8 1.5zM13 10.5l.7 1.8 1.8.7-1.8.7L13 15.5l-.7-1.8-1.8-.7 1.8-.7.7-1.8z"
);

export const HomeIcon = stroke("M2 8l6-5 6 5v6.5a.5.5 0 01-.5.5H10v-4H6v4H2.5a.5.5 0 01-.5-.5V8z", 1.5);
export const Docs = stroke("M3.5 2.5h6L12.5 5.5v8a.5.5 0 01-.5.5h-8a.5.5 0 01-.5-.5v-11a.5.5 0 01.5-.5zM9 2.5v3h3.5", 1.4);
export const Downloads = stroke("M8 2v8M4.5 6.5L8 10l3.5-3.5M3 13h10", 1.5);
export const Desktop = stroke("M2 3h12v9H2zM6 14h4M8 12v2", 1.4);

export const Star = fill(
  "M8 1.7l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.5l-3.8 2 .7-4.3-3.1-3 4.3-.6L8 1.7z"
);

export const Folder = stroke(
  "M2 5a1 1 0 011-1h3l1.5 1.5H13a1 1 0 011 1V12a1 1 0 01-1 1H3a1 1 0 01-1-1V5z",
  1.4
);

export function FolderClosed({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M2 6a2 2 0 012-2h5l2 2h9a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
    </svg>
  );
}

export function FileDoc({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" className={className}>
      <path d="M3.5 2h6L12.5 5v9a.5.5 0 01-.5.5h-8a.5.5 0 01-.5-.5V2.5a.5.5 0 01.5-.5z" fill="currentColor" fillOpacity="0.08" />
      <path d="M9 2v3h3.5" />
    </svg>
  );
}

export const OpenExt = stroke(
  "M9 3h4v4M13 3l-6 6M11 8.5V13a.5.5 0 01-.5.5H3.5A.5.5 0 013 13V5.5a.5.5 0 01.5-.5H8",
  1.4
);

export function FinderApp({ size = 13, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" className={className}>
      <rect x="2" y="3" width="12" height="10" rx="1" />
      <path d="M5 7l2 2 4-4" />
    </svg>
  );
}

export function NoteIcon({ size = 13, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 3h7l3 3v7a1 1 0 01-1 1H3a1 1 0 01-1-1V4a1 1 0 011-1z" />
      <path d="M5 7h6M5 9.5h6M5 12h4" />
    </svg>
  );
}

export const Shield = stroke(
  "M8 1.5l5 2v4.5c0 3-2.5 5.5-5 6.5-2.5-1-5-3.5-5-6.5V3.5l5-2zM5.5 8l2 2 3-3.5",
  1.4
);

export function IndexBars({ size = 12, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round" strokeLinecap="round" className={className}>
      <rect x="2" y="3" width="12" height="3" rx="0.5" />
      <rect x="2" y="7" width="12" height="3" rx="0.5" />
      <rect x="2" y="11" width="12" height="2" rx="0.5" />
    </svg>
  );
}

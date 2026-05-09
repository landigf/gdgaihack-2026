import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function svg(d: string) {
  return ({ size = 16, className, ...rest }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      <path d={d} />
    </svg>
  );
}

export const ArrowLeft = svg("M19 12H5M12 19l-7-7 7-7");
export const ArrowRight = svg("M5 12h14M12 5l7 7-7 7");
export const ArrowUp = svg("M12 19V5M5 12l7-7 7 7");
export const Search = svg("M21 21l-4.35-4.35M10.5 17a6.5 6.5 0 1 1 0-13 6.5 6.5 0 0 1 0 13z");
export const Home = svg("M3 9.5L12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1V9.5z");
export const Folder = svg("M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z");
export const FileText = svg("M14 3v5h5M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-5z");
export const Sparkles = svg("M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3zM5 17l.8 2.2L8 20l-2.2.8L5 23l-.8-2.2L2 20l2.2-.8L5 17zM19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z");
export const NotePlus = svg("M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M19 3v6M16 6h6");
export const ExternalLink = svg("M15 3h6v6M21 3l-9 9M5 5h6v0a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4");
export const FolderSearch = svg("M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v3M14.5 18a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21 21l-3-3");
export const ChevronRight = svg("M9 18l6-6-6-6");
export const Star = svg("M12 2.5l2.9 6.9 7.4.6-5.6 4.9 1.7 7.3L12 18.3 5.6 22.2l1.7-7.3L1.7 10l7.4-.6L12 2.5z");
export const Loader = ({ size = 16, className, ...rest }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    className={`animate-spin ${className ?? ""}`}
    {...rest}
  >
    <path d="M21 12a9 9 0 1 1-6.2-8.55" />
  </svg>
);

/** Custom Rover mark — diamond compass needle inside a soft ring. */
export const Compass = ({ size = 22, className, ...rest }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    {...rest}
  >
    <defs>
      <linearGradient id="rover-mark-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="var(--accent-2)" />
        <stop offset="100%" stopColor="var(--accent)" />
      </linearGradient>
    </defs>
    <circle
      cx="12"
      cy="12"
      r="10"
      fill="url(#rover-mark-grad)"
      opacity="0.18"
    />
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="url(#rover-mark-grad)"
      strokeWidth="1.4"
    />
    <path
      d="M12 5.5 L14.5 12 L12 18.5 L9.5 12 Z"
      fill="url(#rover-mark-grad)"
    />
    <circle cx="12" cy="12" r="1.2" fill="var(--bg)" />
  </svg>
);

export const X = svg("M18 6L6 18M6 6l12 12");
export const Sun = svg("M12 3v2M12 19v2M5 12H3M21 12h-2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4l1.4-1.4M17 7l1.4-1.4M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z");
export const Moon = svg("M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z");
export const Filter = svg("M3 5h18M6 12h12M10 19h4");

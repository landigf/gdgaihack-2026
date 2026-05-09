import { Compass, FolderSearch, Loader, Sparkles } from "./Icon";

type Props = {
  homeLabel: string;
  busy: boolean;
  progress?: string;
  onStart: () => void;
  onSkip: () => void;
};

export default function WelcomeOverlay({
  homeLabel,
  busy,
  progress,
  onStart,
  onSkip,
}: Props) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-6 backdrop-blur-xl bg-black/20 dark:bg-black/55 animate-fade-in-fast">
      <div className="card max-w-md w-full p-8 text-center animate-scale-in shadow-pop">
        {/* Logo + ring pulse */}
        <div className="mx-auto relative w-20 h-20 mb-5">
          <div className="absolute inset-0 rounded-3xl bg-accent-soft animate-ring-pulse" />
          <div className="absolute inset-0 rounded-3xl bg-accent-soft" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Compass size={36} />
          </div>
        </div>

        <h1 className="font-display text-2xl font-semibold text-text tracking-tight">
          Welcome to Rover
        </h1>
        <p className="text-sm text-muted leading-relaxed mt-2 mb-6 max-w-sm mx-auto">
          The AI-powered file finder that runs entirely on your Mac.
          Find documents by what they{" "}
          <span className="text-text font-medium">mean</span> — not just by name.
        </p>

        <div className="text-left rounded-2xl bg-elevated/70 dark:bg-white/5 p-4 mb-5 shadow-soft">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-accent">
              <FolderSearch size={18} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text">
                Index{" "}
                <span className="font-mono text-accent">{homeLabel}</span>
              </p>
              <p className="text-xs text-muted mt-1.5 leading-relaxed">
                We'll scan Documents, Desktop, Downloads — skipping system
                folders, apps, caches, and code repos. Everything stays on this
                device.
              </p>
            </div>
          </div>
        </div>

        {/* Bullet feature list */}
        <ul className="text-left space-y-2.5 text-xs text-muted px-1 mb-6">
          {[
            ["100% offline.", "Models run on your hardware, no cloud."],
            ["Multilingual.", "Search Italian docs in English, and vice versa."],
            ["Native macOS.", "~20 MB shell. Reveal in Finder. Cmd-K search."],
          ].map(([h, body]) => (
            <li key={h} className="flex items-start gap-2">
              <Sparkles size={12} className="text-accent mt-0.5 shrink-0" />
              <span>
                <span className="font-semibold text-text">{h}</span>{" "}
                {body}
              </span>
            </li>
          ))}
        </ul>

        {busy ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-sm text-text">
              <Loader size={16} className="text-accent" />
              <span>Setting things up…</span>
            </div>
            {progress && (
              <p className="text-xs text-muted font-mono">{progress}</p>
            )}
            <p className="text-xs text-subtle">
              First-time setup typically finishes in under a minute.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <button
              onClick={onStart}
              className="btn btn-primary w-full h-11 text-[14px] font-semibold"
            >
              <FolderSearch size={15} />
              Set up Rover
            </button>
            <button
              onClick={onSkip}
              className="btn btn-ghost w-full h-9 text-muted hover:text-text"
            >
              Skip for now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

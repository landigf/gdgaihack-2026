import { Sparkles, FolderSearch, Loader } from "./Icon";

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
    <div className="fixed inset-0 z-40 flex items-center justify-center p-6 backdrop-blur-md bg-black/15 dark:bg-black/50 animate-fade-in-fast">
      <div className="card max-w-md w-full p-7 text-center shadow-[var(--shadow-pop)]">
        <div className="mx-auto w-16 h-16 rounded-3xl bg-accent-soft text-accent flex items-center justify-center mb-4 shadow-[var(--shadow-card)]">
          <Sparkles size={30} />
        </div>
        <h1 className="font-display text-xl font-semibold text-text mb-2">
          Welcome to Rover
        </h1>
        <p className="text-sm text-muted leading-relaxed mb-5">
          Rover finds your files by what they{" "}
          <span className="text-text font-medium">mean</span>, not just by their
          name — entirely on your Mac.
          <br />
          Let's get your documents ready to search.
        </p>

        <div className="text-left rounded-xl bg-black/5 dark:bg-white/5 p-4 mb-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 text-accent">
              <FolderSearch size={18} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text">
                Index <span className="font-mono text-accent">{homeLabel}</span>
              </p>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                We'll scan your Documents, Desktop, Downloads — skipping system
                folders, apps, caches, and code repos. Nothing leaves your Mac.
              </p>
            </div>
          </div>
        </div>

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
              className="btn btn-primary w-full h-11 text-[14px]"
            >
              Set up Rover
            </button>
            <button
              onClick={onSkip}
              className="btn w-full h-10 text-muted hover:text-text hover:bg-black/5 dark:hover:bg-white/5"
            >
              Skip for now — I'll pick a folder later
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

import { Spark, SearchIcon, Shield } from "./Icon";

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
    <div
      className="welcome-scrim"
      onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains("welcome-scrim")) {
          onSkip();
        }
      }}
    >
      <div className="welcome">
        <span className="badge"><Spark /> Welcome to Houston</span>
        <h1>Find any document by what it says, not what it's called.</h1>
        <p className="lede">
          Houston indexes folders on your Mac and uses a small AI — running
          entirely on this machine — to make every document searchable by meaning.
        </p>

        <div className="features">
          <div className="feat">
            <span className="fic"><SearchIcon /></span>
            <div>
              <b>Semantic search</b>
              <span>
                Type "the budget presentation Marco asked for" and find the right
                PDF — even if its filename is{" "}
                <span className="mono">Q3_rev2_final.pdf</span>.
              </span>
            </div>
          </div>
          <div className="feat">
            <span className="fic"><Spark /></span>
            <div>
              <b>Summarize with AI</b>
              <span>
                Get a five-bullet summary of any PDF, DOCX, or Markdown file.
                Save it as a note with one click.
              </span>
            </div>
          </div>
          <div className="feat">
            <span className="fic"><Shield /></span>
            <div>
              <b>100% offline, 100% private</b>
              <span>
                All AI runs locally via Ollama. Your files never leave this Mac.
                The demo works in airplane mode.
              </span>
            </div>
          </div>
        </div>

        <div className="privacy">
          <Shield />
          <span>
            <b>About to be indexed:</b> {homeLabel}/Documents · {homeLabel}/Desktop · {homeLabel}/Downloads
            <br />
            <b>Skipped:</b> ~/Library · /Applications · node_modules · .git · *.tmp
          </span>
        </div>

        {busy ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              fontSize: 12,
              color: "var(--ink-2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: "var(--ai)",
                }}
              />
              <span>Setting things up… this can take up to a minute the first time.</span>
            </div>
            {progress && (
              <span className="mono" style={{ color: "var(--muted)" }}>
                {progress}
              </span>
            )}
          </div>
        ) : (
          <div className="cta">
            <button className="btn" onClick={onSkip}>
              Skip for now
            </button>
            <button className="btn primary" onClick={onStart}>
              <Spark /> Set up Houston
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

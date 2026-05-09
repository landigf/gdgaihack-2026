type Props = {
  engineState: "ready" | "starting" | "installing" | "error";
  engineLabel: string;
  modelInfo: string;
  centerText: string;
};

export default function StatusBar({
  engineState,
  engineLabel,
  modelInfo,
  centerText,
}: Props) {
  const dotClass =
    engineState === "ready"
      ? ""
      : engineState === "error"
      ? "err"
      : "warn";
  return (
    <footer className="statusbar">
      <div className="sb-l">
        <span className={`dot ${dotClass}`} />
        <span>{engineLabel}</span>
        <span className="mono" style={{ color: "var(--faint)" }}>·</span>
        <span className="mono">{modelInfo}</span>
      </div>
      <div className="sb-c mono">{centerText}</div>
      <div className="sb-r">
        <span className="mono">100% local · airplane-mode safe</span>
      </div>
    </footer>
  );
}

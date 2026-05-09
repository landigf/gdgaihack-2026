import { Folder, Sparkles } from "./Icon";

type Props = {
  mode: "browse" | "search";
  /** browse mode */
  folderName?: string;
  itemsCount?: number;
  isIndexed?: boolean;
  /** search mode */
  query?: string;
  hitsCount?: number;
  elapsedMs?: number;
};

export default function HeroHeader({
  mode,
  folderName,
  itemsCount,
  isIndexed,
  query,
  hitsCount,
  elapsedMs,
}: Props) {
  if (mode === "search") {
    return (
      <div className="px-1 pt-1 pb-4 animate-fade-in">
        <div className="flex items-start gap-3">
          <span className="w-11 h-11 rounded-2xl bg-accent-soft text-accent flex items-center justify-center shrink-0 shadow-soft">
            <Sparkles size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl font-semibold text-text leading-tight tracking-tight">
              {query}
            </h1>
            <p className="text-xs text-muted mt-1.5 font-mono tracking-wide">
              {hitsCount ?? 0} {hitsCount === 1 ? "match" : "matches"}
              {elapsedMs !== undefined && (
                <>
                  {" · "}
                  <span className="text-subtle">{elapsedMs} ms</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const name = folderName?.trim() || "Home";
  return (
    <div className="px-1 pt-1 pb-4 animate-fade-in">
      <div className="flex items-end gap-3">
        <span
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-soft ${
            isIndexed ? "icon-tile-folder" : "icon-tile-default"
          }`}
        >
          <Folder size={20} />
        </span>
        <div className="min-w-0 flex-1 pb-0.5">
          <h1 className="font-display text-3xl font-semibold text-text leading-tight tracking-tight truncate" title={name}>
            {name}
          </h1>
          <p className="text-xs text-muted mt-1.5">
            {itemsCount !== undefined && (
              <span className="font-mono">{itemsCount} {itemsCount === 1 ? "item" : "items"}</span>
            )}
            {isIndexed && (
              <>
                {itemsCount !== undefined && <span className="text-subtle"> · </span>}
                <span className="chip chip-accent !py-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  searchable
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

import { Home, Folder, FolderSearch, Star, Loader } from "./Icon";

type QuickItem = { label: string; path: string; kind: "home" | "folder" | "starred" };

type Props = {
  items: QuickItem[];
  currentPath: string;
  onNavigate: (path: string) => void;
  indexedRoot: string | null;
  indexedFiles: number | null;
  indexBusy: boolean;
  onIndexCurrent: () => void;
  currentPathLabel: string;
  canIndexCurrent: boolean;
};

function homeRel(p: string, home: string): string {
  return p.startsWith(home) ? "~" + p.slice(home.length) : p;
}

export default function Sidebar({
  items,
  currentPath,
  onNavigate,
  indexedRoot,
  indexedFiles,
  indexBusy,
  onIndexCurrent,
  currentPathLabel,
  canIndexCurrent,
}: Props) {
  const home = items.find((i) => i.kind === "home")?.path ?? "";

  return (
    <aside className="sidebar-surface w-64 px-2.5 pt-3 pb-3 flex flex-col gap-5 overflow-y-auto">
      {/* Favorites */}
      <section>
        <h2 className="text-2xs font-semibold uppercase tracking-wider text-muted px-2.5 pb-1.5">
          Favorites
        </h2>
        <ul className="flex flex-col gap-0.5">
          {items.map((it) => {
            const Icon = it.kind === "home" ? Home : it.kind === "starred" ? Star : Folder;
            const active = currentPath === it.path;
            return (
              <li key={it.path}>
                <button
                  onClick={() => onNavigate(it.path)}
                  className={`pill w-full flex items-center gap-2.5 px-2.5 py-1.5 text-sm ${
                    active
                      ? "pill-selected font-medium"
                      : "text-text/85 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <Icon
                    size={15}
                    className={active ? "text-accent" : "text-accent/85"}
                  />
                  <span className="truncate">{it.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Smart search section */}
      <section className="px-1">
        <h2 className="text-2xs font-semibold uppercase tracking-wider text-muted px-1.5 pb-2">
          Smart Search
        </h2>
        <div className="flex flex-col gap-2.5">
          <p className="text-xs text-muted leading-snug px-1.5">
            Make a folder searchable by meaning — not just by name.
          </p>
          <button
            onClick={onIndexCurrent}
            disabled={indexBusy || !canIndexCurrent}
            title={
              canIndexCurrent
                ? `Make "${currentPathLabel}" searchable`
                : "Open a folder to index it"
            }
            className="btn btn-primary w-full disabled:bg-accent disabled:opacity-40"
          >
            {indexBusy ? (
              <>
                <Loader size={14} /> Indexing…
              </>
            ) : (
              <>
                <FolderSearch size={14} />
                {indexedRoot === currentPath
                  ? "Re-index this folder"
                  : "Index this folder"}
              </>
            )}
          </button>
          {indexedRoot && (
            <div className="mx-1 rounded-xl bg-black/5 dark:bg-white/5 p-2.5 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                <span className="font-medium text-text">Search ready</span>
              </div>
              <div
                className="font-mono text-muted truncate mt-1"
                title={indexedRoot}
              >
                {homeRel(indexedRoot, home)}
              </div>
              {indexedFiles !== null && (
                <div className="text-muted mt-0.5">
                  {indexedFiles} {indexedFiles === 1 ? "file" : "files"}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Tips */}
      <section className="mt-auto px-1">
        <h2 className="text-2xs font-semibold uppercase tracking-wider text-muted px-1.5 pb-1.5">
          Try
        </h2>
        <ul className="px-1.5 flex flex-col gap-1 text-xs text-muted leading-snug">
          <li>"presentazione budget alpha"</li>
          <li>"meeting notes last sprint"</li>
          <li>"contratto vendor X"</li>
          <li>"recipe with mascarpone"</li>
        </ul>
      </section>
    </aside>
  );
}

export type { QuickItem };

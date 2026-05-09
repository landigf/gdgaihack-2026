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
    <aside className="vibrancy w-64 border-r border-separator p-3 flex flex-col gap-5 overflow-y-auto">
      {/* Favorites */}
      <section>
        <h2 className="text-2xs font-semibold uppercase tracking-wider text-muted px-2 pb-1.5">
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
                  className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm transition ${
                    active
                      ? "bg-accent text-white"
                      : "text-text/85 hover:bg-bg/70"
                  }`}
                >
                  <Icon
                    size={15}
                    className={active ? "text-white" : "text-accent"}
                  />
                  <span className="truncate">{it.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Search corpus section */}
      <section>
        <h2 className="text-2xs font-semibold uppercase tracking-wider text-muted px-2 pb-1.5">
          Smart Search
        </h2>
        <div className="px-2 flex flex-col gap-2">
          <p className="text-xs text-muted leading-snug">
            Pick a folder to make every file inside searchable by meaning, not
            just by name.
          </p>
          <button
            onClick={onIndexCurrent}
            disabled={indexBusy || !canIndexCurrent}
            title={
              canIndexCurrent
                ? `Make "${currentPathLabel}" searchable`
                : "Open a folder to index it"
            }
            className="w-full inline-flex items-center justify-center gap-1.5 h-8 rounded-md bg-accent hover:bg-accent-hover text-white text-sm font-medium transition disabled:bg-accent/40 disabled:cursor-not-allowed"
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
            <div className="bg-bg/60 border border-border rounded-md p-2 text-xs">
              <div className="flex items-center gap-1.5 text-success">
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
                  {indexedFiles} {indexedFiles === 1 ? "file" : "files"}{" "}
                  indexed
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Tips */}
      <section className="mt-auto">
        <h2 className="text-2xs font-semibold uppercase tracking-wider text-muted px-2 pb-1.5">
          Try
        </h2>
        <ul className="px-2 flex flex-col gap-1 text-xs text-muted leading-snug">
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

import type { DirEntry } from "../types";
import { FolderClosed, FileDoc } from "./Icon";

type Props = {
  entries: DirEntry[];
  selected: DirEntry | null;
  onSelect: (e: DirEntry) => void;
  onOpen: (e: DirEntry) => void;
};

function fmtSize(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function fmtDate(ms: number): string {
  if (!ms) return "—";
  const d = new Date(ms);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay)
    return `Today, ${d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays >= 0 && diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: now.getFullYear() === d.getFullYear() ? undefined : "numeric",
  });
}

function kindLabel(e: DirEntry): string {
  if (e.is_dir) return "—";
  return (e.ext || "").toUpperCase() || "FILE";
}

export default function BrowseList({ entries, selected, onSelect, onOpen }: Props) {
  if (entries.length === 0) {
    return (
      <div className="empty">
        <h3>This folder is empty</h3>
        <p>Use ⌘K to search across everything Rover has indexed.</p>
      </div>
    );
  }
  return (
    <>
      <div className="list-head">
        <span className="col" />
        <span className="col">Name</span>
        <span className="col r">Size</span>
        <span className="col r">Date Modified</span>
        <span className="col center">Kind</span>
      </div>
      <div>
        {entries.map((e) => {
          const isSel = !!selected && selected.path === e.path;
          return (
            <div
              key={e.path}
              className={`row ${e.is_dir ? "is-folder" : "is-file"}`}
              aria-selected={isSel}
              onClick={() => onSelect(e)}
              onDoubleClick={() => onOpen(e)}
            >
              <span className="ico">
                {e.is_dir ? <FolderClosed /> : <FileDoc />}
              </span>
              <span className="name">
                <b>{e.name}</b>
              </span>
              <span className="row-meta">
                {e.is_dir ? "—" : fmtSize(e.size)}
              </span>
              <span className="row-meta">{fmtDate(e.modifiedMs)}</span>
              <span className="row-kind">{kindLabel(e)}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

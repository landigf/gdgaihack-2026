import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type DragEvent as ReactDragEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import type { Clipboard, DirEntry } from "../types";
import { FolderClosed, FileDoc } from "./Icon";

export type SelectMode = "single" | "toggle" | "range";

type Props = {
  entries: DirEntry[];
  selectedPaths: Set<string>;
  primaryPath: string | null;
  clipboard: Clipboard;
  renamingPath: string | null;
  onSelect: (e: DirEntry, mode: SelectMode) => void;
  onOpen: (e: DirEntry) => void;
  onContextMenu: (e: DirEntry, x: number, y: number) => void;
  onContextMenuOnEmpty: (x: number, y: number) => void;
  onRenameSubmit: (entry: DirEntry, newName: string) => void;
  onRenameCancel: () => void;
  onDropOnFolder: (srcPaths: string[], targetEntry: DirEntry) => void;
  getDragPathsFor: (entry: DirEntry) => string[];
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

function RenameInput({
  initial,
  onSubmit,
  onCancel,
}: {
  initial: string;
  onSubmit: (v: string) => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLInputElement | null>(null);
  const [value, setValue] = useState(initial);
  const submittedRef = useRef(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const dot = initial.lastIndexOf(".");
    if (dot > 0) el.setSelectionRange(0, dot);
    else el.select();
  }, [initial]);

  function tryCommit() {
    if (submittedRef.current) return;
    submittedRef.current = true;
    const v = value.trim();
    if (v && v !== initial) onSubmit(v);
    else onCancel();
  }

  return (
    <input
      ref={ref}
      className="rename-input"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          tryCommit();
        } else if (e.key === "Escape") {
          e.preventDefault();
          submittedRef.current = true;
          onCancel();
        }
        e.stopPropagation();
      }}
      onBlur={() => tryCommit()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    />
  );
}

export default function BrowseList({
  entries,
  selectedPaths,
  primaryPath,
  clipboard,
  renamingPath,
  onSelect,
  onOpen,
  onContextMenu,
  onContextMenuOnEmpty,
  onRenameSubmit,
  onRenameCancel,
  onDropOnFolder,
  getDragPathsFor,
}: Props) {
  const [dragOverPath, setDragOverPath] = useState<string | null>(null);
  const dragLeaveTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (dragLeaveTimer.current) window.clearTimeout(dragLeaveTimer.current);
    },
    []
  );

  if (entries.length === 0) {
    return (
      <div
        className="empty"
        onContextMenu={(e) => {
          e.preventDefault();
          onContextMenuOnEmpty(e.clientX, e.clientY);
        }}
      >
        <h3>This folder is empty</h3>
        <p>Right-click here to create a new folder, or use ⌘K to search.</p>
      </div>
    );
  }

  function handleClick(e: ReactMouseEvent, entry: DirEntry) {
    if (renamingPath === entry.path) return;
    let mode: SelectMode = "single";
    if (e.metaKey || e.ctrlKey) mode = "toggle";
    else if (e.shiftKey) mode = "range";
    onSelect(entry, mode);
  }

  function handleContextMenu(e: ReactMouseEvent, entry: DirEntry) {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(entry, e.clientX, e.clientY);
  }

  function handleDragStart(e: ReactDragEvent, entry: DirEntry) {
    if (renamingPath) {
      e.preventDefault();
      return;
    }
    const paths = getDragPathsFor(entry);
    e.dataTransfer.setData(
      "application/x-houston-paths",
      JSON.stringify(paths)
    );
    e.dataTransfer.setData("text/plain", paths.join("\n"));
    e.dataTransfer.effectAllowed = "copyMove";
  }

  function handleDragOver(e: ReactDragEvent, entry: DirEntry) {
    if (!entry.is_dir) return;
    if (selectedPaths.has(entry.path)) return; // can't drop on self
    e.preventDefault();
    e.dataTransfer.dropEffect = e.altKey ? "copy" : "move";
    if (dragOverPath !== entry.path) setDragOverPath(entry.path);
  }

  function handleDragLeave(_e: ReactDragEvent, entry: DirEntry) {
    if (dragOverPath !== entry.path) return;
    if (dragLeaveTimer.current) window.clearTimeout(dragLeaveTimer.current);
    dragLeaveTimer.current = window.setTimeout(() => {
      setDragOverPath((cur) => (cur === entry.path ? null : cur));
    }, 30);
  }

  function handleDrop(e: ReactDragEvent, entry: DirEntry) {
    if (!entry.is_dir) return;
    e.preventDefault();
    setDragOverPath(null);
    const data = e.dataTransfer.getData("application/x-houston-paths");
    let paths: string[] = [];
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed))
          paths = parsed.filter((p) => typeof p === "string");
      } catch {
        /* ignore */
      }
    }
    if (paths.length === 0) return;
    onDropOnFolder(paths, entry);
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
      <div
        onContextMenu={(e) => {
          if (e.target === e.currentTarget) {
            e.preventDefault();
            onContextMenuOnEmpty(e.clientX, e.clientY);
          }
        }}
      >
        {entries.map((e) => {
          const isSel = selectedPaths.has(e.path);
          const isRenaming = renamingPath === e.path;
          const isClipped =
            !!clipboard &&
            clipboard.op === "cut" &&
            clipboard.paths.includes(e.path);
          const isDragOver = dragOverPath === e.path;
          const isPrimary = primaryPath === e.path;
          return (
            <div
              key={e.path}
              className={`row ${e.is_dir ? "is-folder" : "is-file"}${
                isClipped ? " is-clipped" : ""
              }${isDragOver ? " is-drag-over" : ""}`}
              aria-selected={isSel}
              data-primary={isPrimary || undefined}
              onClick={(ev) => handleClick(ev, e)}
              onDoubleClick={() => !isRenaming && onOpen(e)}
              onContextMenu={(ev) => handleContextMenu(ev, e)}
              draggable={!isRenaming}
              onDragStart={(ev) => handleDragStart(ev, e)}
              onDragOver={(ev) => handleDragOver(ev, e)}
              onDragEnter={(ev) => handleDragOver(ev, e)}
              onDragLeave={(ev) => handleDragLeave(ev, e)}
              onDrop={(ev) => handleDrop(ev, e)}
            >
              <span className="ico">
                {e.is_dir ? <FolderClosed /> : <FileDoc />}
              </span>
              <span className="name">
                {isRenaming ? (
                  <RenameInput
                    initial={e.name}
                    onSubmit={(v) => onRenameSubmit(e, v)}
                    onCancel={onRenameCancel}
                  />
                ) : (
                  <b>{e.name}</b>
                )}
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

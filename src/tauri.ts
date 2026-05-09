import { invoke } from "@tauri-apps/api/core";
import type { DirEntry } from "./types";

export const tauri = {
  homeDir: () => invoke<string>("home_dir"),
  listDir: (path: string) => invoke<DirEntry[]>("list_dir", { path }),
  pickFolder: () => invoke<string | null>("pick_folder"),
  revealInFinder: (path: string) => invoke<void>("reveal_in_finder", { path }),
  openFile: (path: string) => invoke<void>("open_file", { path }),
  createNote: (folder: string, title: string, body: string) =>
    invoke<{ path: string }>("create_note", { folder, title, body }),
  confirmMove: (src: string, dst: string) =>
    invoke<boolean>("confirm_move", { src, dst }),
  moveFile: (src: string, dst: string) =>
    invoke<{ newPath: string }>("move_file", { src, dst }),
  backendUrl: () => invoke<string>("backend_url"),

  // file-explorer ops
  renamePath: (path: string, newName: string) =>
    invoke<DirEntry>("rename_path", { path, newName }),
  copyPath: (src: string, dstDir: string, newName?: string | null) =>
    invoke<DirEntry>("copy_path", { src, dstDir, newName: newName ?? null }),
  movePath: (src: string, dstDir: string) =>
    invoke<DirEntry>("move_path", { src, dstDir }),
  moveToTrash: (paths: string[]) =>
    invoke<number>("move_to_trash", { paths }),
  createFolder: (parent: string, name: string) =>
    invoke<DirEntry>("create_folder", { parent, name }),
};

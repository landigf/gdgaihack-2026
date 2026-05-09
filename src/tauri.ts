import { invoke } from "@tauri-apps/api/core";

export const tauri = {
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
};

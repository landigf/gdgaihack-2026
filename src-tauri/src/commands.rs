use chrono::Local;
use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::UNIX_EPOCH;
use tauri::AppHandle;
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons, MessageDialogKind};
use tauri_plugin_shell::ShellExt;

use crate::sidecar::SIDECAR_PORT;

#[derive(Serialize)]
pub struct DirEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
    pub size: u64,
    #[serde(rename = "modifiedMs")]
    pub modified_ms: i64,
    pub ext: String,
}

#[derive(Serialize)]
pub struct CreatedNote {
    pub path: String,
}

#[derive(Serialize)]
pub struct MoveResult {
    #[serde(rename = "newPath")]
    pub new_path: String,
}

#[tauri::command]
pub async fn backend_url() -> String {
    format!("http://127.0.0.1:{SIDECAR_PORT}")
}

#[tauri::command]
pub fn home_dir() -> Result<String, String> {
    std::env::var("HOME")
        .or_else(|_| {
            dirs_user_home()
                .ok_or_else(|| "no home dir".to_string())
                .map(|p| p.to_string_lossy().into_owned())
        })
        .map_err(|e| e.to_string())
}

fn dirs_user_home() -> Option<PathBuf> {
    std::env::var_os("HOME").map(PathBuf::from)
}

#[tauri::command]
pub fn list_dir(path: String) -> Result<Vec<DirEntry>, String> {
    let p = if path.is_empty() {
        PathBuf::from(std::env::var("HOME").unwrap_or_else(|_| "/".into()))
    } else {
        PathBuf::from(&path)
    };
    if !p.exists() {
        return Err(format!("path not found: {}", p.display()));
    }
    if !p.is_dir() {
        return Err(format!("not a directory: {}", p.display()));
    }
    let mut entries: Vec<DirEntry> = Vec::new();
    for entry in fs::read_dir(&p).map_err(|e| format!("read_dir: {e}"))? {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };
        let name = entry.file_name().to_string_lossy().into_owned();
        if name.starts_with('.') {
            continue;
        }
        let meta = match entry.metadata() {
            Ok(m) => m,
            Err(_) => continue,
        };
        let modified_ms = meta
            .modified()
            .ok()
            .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
            .map(|d| d.as_millis() as i64)
            .unwrap_or(0);
        let ext = if meta.is_file() {
            entry
                .path()
                .extension()
                .map(|s| s.to_string_lossy().to_lowercase())
                .unwrap_or_default()
        } else {
            String::new()
        };
        entries.push(DirEntry {
            name,
            path: entry.path().to_string_lossy().into_owned(),
            is_dir: meta.is_dir(),
            size: if meta.is_file() { meta.len() } else { 0 },
            modified_ms,
            ext,
        });
    }
    entries.sort_by(|a, b| match (a.is_dir, b.is_dir) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });
    Ok(entries)
}

#[tauri::command]
pub async fn pick_folder(app: AppHandle) -> Option<String> {
    let (tx, rx) = tokio::sync::oneshot::channel();
    app.dialog()
        .file()
        .set_title("Select a folder to index")
        .pick_folder(move |p| {
            let _ = tx.send(p.map(|fp| fp.to_string()));
        });
    rx.await.ok().flatten()
}

#[tauri::command]
pub fn reveal_in_finder(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Err(format!("path not found: {path}"));
    }
    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .args(["-R", &path])
            .status()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        let target = p.parent().unwrap_or(p);
        Command::new("xdg-open")
            .arg(target)
            .status()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .args(["/select,", &path])
            .status()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn open_file(app: AppHandle, path: String) -> Result<(), String> {
    app.shell().open(path, None).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_note(folder: String, title: String, body: String) -> Result<CreatedNote, String> {
    let safe: String = title
        .chars()
        .map(|c| {
            if c.is_alphanumeric() || c == '-' || c == '_' {
                c
            } else {
                '_'
            }
        })
        .collect::<String>()
        .trim_matches('_')
        .to_string();
    let safe = if safe.is_empty() {
        "note".into()
    } else {
        safe
    };
    let stamp = Local::now().format("%Y%m%d-%H%M%S").to_string();
    let mut out: PathBuf = PathBuf::from(&folder);
    out.push(format!("{safe}-{stamp}.md"));
    fs::write(&out, body).map_err(|e| format!("write failed: {e}"))?;
    Ok(CreatedNote {
        path: out.to_string_lossy().into_owned(),
    })
}

#[tauri::command]
pub async fn confirm_move(app: AppHandle, src: String, dst: String) -> bool {
    let (tx, rx) = tokio::sync::oneshot::channel();
    let src_name = Path::new(&src)
        .file_name()
        .map(|s| s.to_string_lossy().into_owned())
        .unwrap_or_default();
    let detail = format!(
        "From:\n{}\n\nTo:\n{}",
        Path::new(&src)
            .parent()
            .map(|p| p.to_string_lossy().into_owned())
            .unwrap_or_default(),
        dst
    );
    app.dialog()
        .message(detail)
        .title(format!("Move {src_name}?"))
        .kind(MessageDialogKind::Warning)
        .buttons(MessageDialogButtons::OkCancelCustom(
            "Move".into(),
            "Cancel".into(),
        ))
        .show(move |answered| {
            let _ = tx.send(answered);
        });
    rx.await.unwrap_or(false)
}

#[tauri::command]
pub fn move_file(src: String, dst: String) -> Result<MoveResult, String> {
    let src_p = Path::new(&src);
    let dst_p = Path::new(&dst);
    if !src_p.exists() {
        return Err(format!("source missing: {src}"));
    }
    if !dst_p.is_dir() {
        return Err(format!("destination not a folder: {dst}"));
    }
    let target = dst_p.join(src_p.file_name().ok_or("invalid source name")?);
    if target.exists() {
        return Err(format!("target already exists: {}", target.display()));
    }
    fs::rename(src_p, &target).map_err(|e| format!("rename failed: {e}"))?;
    Ok(MoveResult {
        new_path: target.to_string_lossy().into_owned(),
    })
}

// ------------------------------------------------------------------
// File-explorer file operations: rename / copy / move / trash / mkdir
// ------------------------------------------------------------------

fn dir_entry_from_path(path: &Path) -> Result<DirEntry, String> {
    let meta = path
        .metadata()
        .map_err(|e| format!("metadata: {e}"))?;
    let modified_ms = meta
        .modified()
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0);
    let ext = if meta.is_file() {
        path.extension()
            .map(|s| s.to_string_lossy().to_lowercase())
            .unwrap_or_default()
    } else {
        String::new()
    };
    let name = path
        .file_name()
        .map(|s| s.to_string_lossy().into_owned())
        .unwrap_or_default();
    Ok(DirEntry {
        name,
        path: path.to_string_lossy().into_owned(),
        is_dir: meta.is_dir(),
        size: if meta.is_file() { meta.len() } else { 0 },
        modified_ms,
        ext,
    })
}

fn copy_dir_recursive(src: &Path, dst: &Path) -> Result<(), String> {
    fs::create_dir_all(dst).map_err(|e| format!("mkdir {}: {e}", dst.display()))?;
    for entry in fs::read_dir(src).map_err(|e| format!("read_dir: {e}"))? {
        let entry = entry.map_err(|e| format!("dir entry: {e}"))?;
        let from = entry.path();
        let to = dst.join(entry.file_name());
        let ft = entry.file_type().map_err(|e| format!("file_type: {e}"))?;
        if ft.is_dir() {
            copy_dir_recursive(&from, &to)?;
        } else if ft.is_symlink() {
            // Best-effort: re-create the symlink rather than copying contents.
            #[cfg(unix)]
            {
                let target = fs::read_link(&from).map_err(|e| format!("readlink: {e}"))?;
                std::os::unix::fs::symlink(target, &to)
                    .map_err(|e| format!("symlink: {e}"))?;
            }
            #[cfg(not(unix))]
            {
                fs::copy(&from, &to).map_err(|e| format!("copy symlink: {e}"))?;
            }
        } else {
            fs::copy(&from, &to).map_err(|e| format!("copy {}: {e}", from.display()))?;
        }
    }
    Ok(())
}

#[tauri::command]
pub fn rename_path(path: String, new_name: String) -> Result<DirEntry, String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Err(format!("path not found: {path}"));
    }
    let trimmed = new_name.trim();
    if trimmed.is_empty()
        || trimmed.contains('/')
        || trimmed == "."
        || trimmed == ".."
    {
        return Err(format!("invalid name: {new_name:?}"));
    }
    let parent = p.parent().ok_or("path has no parent")?;
    let target = parent.join(trimmed);
    if target == p {
        return dir_entry_from_path(p);
    }
    if target.exists() {
        return Err(format!("a file or folder named '{trimmed}' already exists"));
    }
    fs::rename(p, &target).map_err(|e| format!("rename failed: {e}"))?;
    dir_entry_from_path(&target)
}

#[tauri::command]
pub fn copy_path(
    src: String,
    dst_dir: String,
    new_name: Option<String>,
) -> Result<DirEntry, String> {
    let src_p = Path::new(&src);
    let dst_p = Path::new(&dst_dir);
    if !src_p.exists() {
        return Err(format!("source missing: {src}"));
    }
    if !dst_p.is_dir() {
        return Err(format!("destination not a folder: {dst_dir}"));
    }
    let name = new_name
        .as_deref()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| {
            src_p
                .file_name()
                .map(|s| s.to_string_lossy().into_owned())
                .unwrap_or_default()
        });
    let target = dst_p.join(&name);
    if target == src_p {
        return Err("source and destination are the same".into());
    }
    if target.exists() {
        return Err(format!("a file or folder named '{name}' already exists"));
    }
    if src_p.is_dir() {
        copy_dir_recursive(src_p, &target)?;
    } else {
        fs::copy(src_p, &target).map_err(|e| format!("copy failed: {e}"))?;
    }
    dir_entry_from_path(&target)
}

#[tauri::command]
pub fn move_path(src: String, dst_dir: String) -> Result<DirEntry, String> {
    let src_p = Path::new(&src);
    let dst_p = Path::new(&dst_dir);
    if !src_p.exists() {
        return Err(format!("source missing: {src}"));
    }
    if !dst_p.is_dir() {
        return Err(format!("destination not a folder: {dst_dir}"));
    }
    let name = src_p
        .file_name()
        .map(|s| s.to_string_lossy().into_owned())
        .ok_or("invalid source name")?;
    let target = dst_p.join(&name);
    if target == src_p {
        return Err("source and destination are the same".into());
    }
    if target.exists() {
        return Err(format!("a file or folder named '{name}' already exists at the destination"));
    }
    // Try fast same-volume rename first; fall back to copy + delete.
    if fs::rename(src_p, &target).is_err() {
        if src_p.is_dir() {
            copy_dir_recursive(src_p, &target)?;
            fs::remove_dir_all(src_p).map_err(|e| format!("remove source: {e}"))?;
        } else {
            fs::copy(src_p, &target).map_err(|e| format!("copy: {e}"))?;
            fs::remove_file(src_p).map_err(|e| format!("remove source: {e}"))?;
        }
    }
    dir_entry_from_path(&target)
}

#[tauri::command]
pub fn move_to_trash(paths: Vec<String>) -> Result<usize, String> {
    let mut count = 0usize;
    let mut last_err: Option<String> = None;
    for p in &paths {
        if !Path::new(p).exists() {
            continue;
        }
        match trash::delete(p) {
            Ok(()) => count += 1,
            Err(e) => last_err = Some(format!("trash {p}: {e}")),
        }
    }
    if count == 0 && last_err.is_some() {
        return Err(last_err.unwrap());
    }
    Ok(count)
}

#[tauri::command]
pub fn create_folder(parent: String, name: String) -> Result<DirEntry, String> {
    let parent_p = Path::new(&parent);
    if !parent_p.is_dir() {
        return Err(format!("parent is not a folder: {parent}"));
    }
    let trimmed = name.trim();
    if trimmed.is_empty() || trimmed.contains('/') || trimmed == "." || trimmed == ".." {
        return Err(format!("invalid name: {name:?}"));
    }
    let target = parent_p.join(trimmed);
    if target.exists() {
        return Err(format!("a file or folder named '{trimmed}' already exists"));
    }
    fs::create_dir(&target).map_err(|e| format!("create folder failed: {e}"))?;
    dir_entry_from_path(&target)
}

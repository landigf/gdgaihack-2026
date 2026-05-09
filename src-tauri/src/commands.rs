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

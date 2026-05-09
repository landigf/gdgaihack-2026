mod commands;
mod sidecar;

use std::sync::Mutex;
use tauri::{Emitter, Manager};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .manage(sidecar::SidecarHandle(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![
            commands::backend_url,
            commands::home_dir,
            commands::list_dir,
            commands::pick_folder,
            commands::reveal_in_finder,
            commands::open_file,
            commands::create_note,
            commands::confirm_move,
            commands::move_file,
            // file-explorer ops
            commands::rename_path,
            commands::copy_path,
            commands::move_path,
            commands::move_to_trash,
            commands::create_folder,
        ])
        .setup(|app| {
            let handle = app.handle().clone();
            let _ = handle.emit("sidecar-status", "starting");
            tauri::async_runtime::spawn(async move {
                match sidecar::start(&handle).await {
                    Ok(url) => {
                        println!("[houston] sidecar ready at {url}");
                        let _ = handle.emit("sidecar-status", "ready");
                    }
                    Err(e) => {
                        eprintln!("[houston] sidecar error: {e}");
                        let _ = handle.emit("sidecar-status", "error");
                    }
                }
            });
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                sidecar::stop(window.app_handle());
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

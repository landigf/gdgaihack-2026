use std::path::PathBuf;
use std::process::Stdio;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Manager};
use tokio::process::{Child, Command};
use tokio::time::sleep;

pub const SIDECAR_PORT: u16 = 8765;

pub struct SidecarHandle(pub Mutex<Option<Child>>);

fn backend_dir(app: &AppHandle) -> PathBuf {
    if cfg!(debug_assertions) {
        let mut p = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
        if p.ends_with("src-tauri") {
            p.pop();
        }
        p.push("backend");
        p
    } else {
        let mut p = app.path().resource_dir().expect("resource_dir");
        p.push("backend");
        p
    }
}

fn python_bin(backend: &PathBuf) -> PathBuf {
    let venv = backend.join(".venv/bin/python3");
    if venv.exists() {
        venv
    } else {
        PathBuf::from("python3")
    }
}

pub async fn start(app: &AppHandle) -> Result<String, String> {
    let backend = backend_dir(app);
    if !backend.exists() {
        return Err(format!("backend dir missing: {}", backend.display()));
    }
    let py = python_bin(&backend);

    let child = Command::new(&py)
        .arg("-m")
        .arg("uvicorn")
        .arg("main:app")
        .arg("--host")
        .arg("127.0.0.1")
        .arg("--port")
        .arg(SIDECAR_PORT.to_string())
        .current_dir(&backend)
        .env("PYTHONUNBUFFERED", "1")
        .stdout(Stdio::inherit())
        .stderr(Stdio::inherit())
        .spawn()
        .map_err(|e| format!("spawn failed ({}): {e}", py.display()))?;

    let state = app.state::<SidecarHandle>();
    *state.0.lock().unwrap() = Some(child);

    let url = format!("http://127.0.0.1:{SIDECAR_PORT}");
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(2))
        .build()
        .map_err(|e| e.to_string())?;
    for _ in 0..60 {
        if let Ok(r) = client.get(format!("{url}/health")).send().await {
            if r.status().is_success() {
                return Ok(url);
            }
        }
        sleep(Duration::from_millis(500)).await;
    }
    Err("sidecar failed to become healthy in 30s".into())
}

pub fn stop(app: &AppHandle) {
    if let Some(state) = app.try_state::<SidecarHandle>() {
        if let Some(mut child) = state.0.lock().unwrap().take() {
            let _ = child.start_kill();
        }
    }
}

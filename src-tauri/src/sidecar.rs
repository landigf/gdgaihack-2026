use std::fs;
use std::path::{Path, PathBuf};
use std::process::Stdio;
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};
use tokio::process::{Child, Command};
use tokio::time::sleep;

pub const SIDECAR_PORT: u16 = 8765;

/// Bumped whenever the bundled backend sources or requirements.txt change.
/// Used to invalidate the cached app_data_dir copy on user upgrades.
const SIDECAR_VERSION: &str = "1";

/// Files to copy from the bundled backend resource dir to the user-writable
/// app_data_dir. Anything not in this list is intentionally left out
/// (tests, __pycache__, data, .venv).
const BACKEND_FILES: &[&str] = &[
    "main.py",
    "config.py",
    "models.py",
    "parsing.py",
    "chunking.py",
    "ollama_client.py",
    "store.py",
    "indexer.py",
    "retriever.py",
    "requirements.txt",
];

pub struct SidecarHandle(pub Mutex<Option<Child>>);

/// Resolve the backend dir we will run uvicorn from, lazily creating the
/// venv on first launch in production builds.
///
/// Dev (`cfg!(debug_assertions)`): use `<project>/backend/` directly. The
/// venv is created by `scripts/setup.sh` and trusted to exist.
///
/// Prod: copy bundled sources to `~/Library/Application Support/<id>/backend/`,
/// create `.venv` there with the user's system Python, `pip install -r
/// requirements.txt`. Subsequent launches skip both steps.
async fn ensure_backend(app: &AppHandle) -> Result<PathBuf, String> {
    if cfg!(debug_assertions) {
        let mut p = std::env::current_dir().unwrap_or_else(|_| PathBuf::from("."));
        if p.ends_with("src-tauri") {
            p.pop();
        }
        p.push("backend");
        return Ok(p);
    }

    let bundled = app
        .path()
        .resource_dir()
        .map_err(|e| format!("resource_dir: {e}"))?
        .join("backend");

    let target = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("app_data_dir: {e}"))?
        .join("backend");

    fs::create_dir_all(&target).map_err(|e| format!("mkdir {}: {e}", target.display()))?;

    // Stale install detection: the version file is rewritten only after a
    // successful copy, so a partial copy (interrupted launch) re-runs.
    let version_path = target.join(".rover-version");
    let cached_version = fs::read_to_string(&version_path)
        .ok()
        .map(|s| s.trim().to_string());
    let needs_recopy = cached_version.as_deref() != Some(SIDECAR_VERSION);

    if needs_recopy {
        for name in BACKEND_FILES {
            let src = bundled.join(name);
            let dst = target.join(name);
            if !src.exists() {
                return Err(format!(
                    "bundled file missing — corrupt .app? {}",
                    src.display()
                ));
            }
            fs::copy(&src, &dst).map_err(|e| format!("copy {name}: {e}"))?;
        }
        fs::write(&version_path, SIDECAR_VERSION)
            .map_err(|e| format!("write version: {e}"))?;
    }

    let venv_python = target.join(".venv/bin/python3");
    if !venv_python.exists() {
        let _ = app.emit("sidecar-status", "installing");

        // Step 1: python3 -m venv .venv
        let venv_status = Command::new("python3")
            .arg("-m")
            .arg("venv")
            .arg(".venv")
            .current_dir(&target)
            .stdout(Stdio::inherit())
            .stderr(Stdio::inherit())
            .status()
            .await
            .map_err(|e| format!("python3 -m venv failed: {e} — is Python 3 installed?"))?;
        if !venv_status.success() {
            return Err("Python venv creation failed.".into());
        }

        // Step 2: upgrade pip (non-fatal if it errors)
        let _ = Command::new(&venv_python)
            .arg("-m")
            .arg("pip")
            .arg("install")
            .arg("--no-input")
            .arg("--upgrade")
            .arg("pip")
            .current_dir(&target)
            .stdout(Stdio::inherit())
            .stderr(Stdio::inherit())
            .status()
            .await;

        // Step 3: pip install -r requirements.txt
        let install_status = Command::new(&venv_python)
            .arg("-m")
            .arg("pip")
            .arg("install")
            .arg("--no-input")
            .arg("-r")
            .arg("requirements.txt")
            .current_dir(&target)
            .stdout(Stdio::inherit())
            .stderr(Stdio::inherit())
            .status()
            .await
            .map_err(|e| format!("pip install failed: {e}"))?;
        if !install_status.success() {
            return Err("pip install -r requirements.txt failed.".into());
        }
    }

    Ok(target)
}

fn python_bin(backend: &Path) -> PathBuf {
    let venv = backend.join(".venv/bin/python3");
    if venv.exists() {
        venv
    } else {
        PathBuf::from("python3")
    }
}

pub async fn start(app: &AppHandle) -> Result<String, String> {
    let backend = ensure_backend(app).await?;
    let py = python_bin(&backend);

    let _ = app.emit("sidecar-status", "starting");

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

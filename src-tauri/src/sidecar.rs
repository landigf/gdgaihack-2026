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
/// Bumped to "2" when we extended the bundle to include ares/, cache/,
/// agent_tools/, prompts.py, mlx_client.py + the mars-corpus PDFs.
const SIDECAR_VERSION: &str = "2";

/// Directory entries to skip when copying the bundled backend tree.
/// Local dev artifacts that bloat the .app or break in production.
const COPY_SKIP: &[&str] = &[".venv", "__pycache__", "tests", "data", "out"];

/// Recursively copy the contents of `src` into `dst`, creating parent
/// dirs as needed. Skips entries whose name is in `skip` (typed
/// against the file_name() string match).
fn copy_dir_recursive(src: &Path, dst: &Path, skip: &[&str]) -> Result<(), String> {
    fs::create_dir_all(dst).map_err(|e| format!("mkdir {}: {e}", dst.display()))?;
    let entries = fs::read_dir(src).map_err(|e| format!("read_dir {}: {e}", src.display()))?;
    for entry in entries {
        let entry = entry.map_err(|e| format!("read entry in {}: {e}", src.display()))?;
        let path = entry.path();
        let name_os = entry.file_name();
        let name = name_os.to_string_lossy();
        if skip.iter().any(|s| name.as_ref() == *s) {
            continue;
        }
        let dst_path = dst.join(name.as_ref());
        let ft = entry
            .file_type()
            .map_err(|e| format!("file_type {}: {e}", path.display()))?;
        if ft.is_dir() {
            copy_dir_recursive(&path, &dst_path, skip)?;
        } else if ft.is_file() {
            fs::copy(&path, &dst_path)
                .map_err(|e| format!("copy {} -> {}: {e}", path.display(), dst_path.display()))?;
        }
        // Symlinks are intentionally ignored (none in our bundle).
    }
    Ok(())
}

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

    let resource_dir = app
        .path()
        .resource_dir()
        .map_err(|e| format!("resource_dir: {e}"))?;
    let bundled_backend = resource_dir.join("backend");
    let bundled_corpus = resource_dir.join("mars-corpus");

    let app_data = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("app_data_dir: {e}"))?;
    let target = app_data.join("backend");
    let corpus_target = app_data.join("mars-corpus");

    fs::create_dir_all(&target).map_err(|e| format!("mkdir {}: {e}", target.display()))?;

    // Stale install detection: the version file is rewritten only after a
    // successful copy, so a partial copy (interrupted launch) re-runs.
    let version_path = target.join(".houston-version");
    let cached_version = fs::read_to_string(&version_path)
        .ok()
        .map(|s| s.trim().to_string());
    let needs_recopy = cached_version.as_deref() != Some(SIDECAR_VERSION);

    if needs_recopy {
        if !bundled_backend.exists() {
            return Err(format!(
                "bundled backend missing — corrupt .app? {}",
                bundled_backend.display()
            ));
        }
        // Recursive copy of the entire backend/ tree (skipping .venv,
        // __pycache__, tests, data, out). Picks up prompts.py +
        // mlx_client.py + ares/ + cache/ + agent_tools/.
        copy_dir_recursive(&bundled_backend, &target, COPY_SKIP)?;

        // Mars corpus → app_data_dir/mars-corpus/. Backend code resolves
        // it 3 levels up from ares/router.py, which lands at app_data_dir.
        if bundled_corpus.exists() {
            copy_dir_recursive(&bundled_corpus, &corpus_target, &[])?;
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

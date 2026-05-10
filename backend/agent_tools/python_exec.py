"""Sandboxed Python executor — the single tool a Houston agent gets.

Hardening (best-effort, demo-grade — not a security boundary):
  - subprocess with `python3 -I -B` (isolated mode, no .pyc, no PYTHONPATH)
  - clean env: only PATH, HOME=<tempdir>, HOUSTON_API, HOUSTON_ARTIFACTS
  - working dir = tempfile.mkdtemp(prefix="houston_exec_")
  - subprocess.run timeout (default 15 s, hard cap 30 s)
  - resource.setrlimit on CPU / file size / open files / processes
  - stdout & stderr truncated to 8 KB each
  - artifacts directory shared back to the parent so plots are returned
"""
from __future__ import annotations

import json
import os
import resource
import shutil
import subprocess
import sys
import tempfile
import textwrap
import time
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any


MAX_CPU_SECONDS = 10
MAX_FILE_SIZE = 16 * 1024 * 1024  # 16 MB per file
MAX_OPEN_FILES = 64
MAX_PROCESSES = 8
MAX_OUTPUT_BYTES = 8192
HARD_TIMEOUT_S = 30
DEFAULT_TIMEOUT_S = 15


@dataclass
class ExecRequest:
    code: str
    timeout_s: float = DEFAULT_TIMEOUT_S
    notes: str | None = None  # free text the LLM can attach (why it ran this)


@dataclass
class ExecResult:
    ok: bool
    elapsed_ms: int
    stdout: str
    stderr: str
    artifacts: list[dict[str, Any]] = field(default_factory=list)
    return_code: int | None = None
    timeout: bool = False
    truncated_stdout: bool = False
    truncated_stderr: bool = False
    error: str | None = None

    def to_dict(self) -> dict:
        return asdict(self)


def _set_limits():
    # Inside the child process; macOS supports CPU + open files + processes.
    try:
        resource.setrlimit(resource.RLIMIT_CPU, (MAX_CPU_SECONDS, MAX_CPU_SECONDS))
    except (ValueError, OSError):
        pass
    try:
        resource.setrlimit(resource.RLIMIT_FSIZE, (MAX_FILE_SIZE, MAX_FILE_SIZE))
    except (ValueError, OSError):
        pass
    try:
        resource.setrlimit(resource.RLIMIT_NOFILE, (MAX_OPEN_FILES, MAX_OPEN_FILES))
    except (ValueError, OSError):
        pass
    try:
        # Best-effort process cap — macOS calls this RLIMIT_NPROC.
        resource.setrlimit(resource.RLIMIT_NPROC, (MAX_PROCESSES, MAX_PROCESSES))
    except (ValueError, OSError):
        pass


def _wrapper_source(user_code: str, sdk_path: str) -> str:
    # The wrapper imports the allow-listed SDK BEFORE the user's code runs.
    # We deliberately do not block any import — sandboxing is via subprocess
    # isolation and rlimits, not via AST rewriting (too brittle for a demo).
    return textwrap.dedent(f"""
    import sys, traceback
    sys.path.insert(0, {sdk_path!r})
    import houston_sdk as houston  # noqa: F401  -- exposed as global below

    # Re-export houston_sdk as a top-level name `houston`. Snippet code can
    # do `houston.sensors.history(...)`.
    globals()['houston'] = houston

    USER_CODE = {user_code!r}
    try:
        exec(USER_CODE, globals())
    except SystemExit:
        raise
    except BaseException:
        traceback.print_exc()
        sys.exit(1)
    """).strip()


def run_python(req: ExecRequest) -> ExecResult:
    """Execute `req.code` inside a hardened subprocess. Returns
    (stdout, stderr, artifacts) — never raises for snippet errors; returns
    `ok=False` and the captured traceback in `stderr` instead."""
    timeout = max(1.0, min(HARD_TIMEOUT_S, req.timeout_s or DEFAULT_TIMEOUT_S))
    workdir = Path(tempfile.mkdtemp(prefix="houston_exec_"))
    artifacts_dir = workdir / "artifacts"
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    # Place the SDK on a path the wrapper can import. We copy a pointer
    # file rather than the module so we don't fork the source of truth.
    pkg_dir = Path(__file__).resolve().parent
    sdk_path = str(pkg_dir)
    # The wrapper imports `houston_sdk` directly, so add a thin alias module.
    alias = workdir / "houston_sdk.py"
    alias.write_text(
        "from houston_sdk import sensors, rag, files, plot  # type: ignore\n"
    )

    wrapper_src = _wrapper_source(req.code, sdk_path)
    runner_path = workdir / "_runner.py"
    runner_path.write_text(wrapper_src)

    env = {
        "PATH": os.environ.get("PATH", "/usr/bin:/bin"),
        "HOME": str(workdir),
        "TMPDIR": str(workdir),
        "HOUSTON_API": os.environ.get("HOUSTON_API", "http://127.0.0.1:8765"),
        "HOUSTON_ARTIFACTS": str(artifacts_dir),
        # MLX + matplotlib look for these at import time.
        "MPLBACKEND": "Agg",
    }

    t0 = time.time()
    timed_out = False
    try:
        # `-I` enables isolated mode (no PYTHONPATH, no per-user site, etc.).
        # `-B` skips writing .pyc files in the workdir.
        completed = subprocess.run(
            [sys.executable, "-I", "-B", str(runner_path)],
            cwd=str(workdir),
            env=env,
            capture_output=True,
            timeout=timeout,
            preexec_fn=_set_limits,
        )
        rc = completed.returncode
        out_bytes = completed.stdout
        err_bytes = completed.stderr
    except subprocess.TimeoutExpired as e:
        timed_out = True
        rc = -9
        out_bytes = e.stdout or b""
        err_bytes = (e.stderr or b"") + f"\n[killed: timeout {timeout:.1f}s]".encode()
    except Exception as e:
        return ExecResult(
            ok=False, elapsed_ms=int((time.time() - t0) * 1000),
            stdout="", stderr=f"sandbox failure: {e}", error=str(e),
        )

    elapsed_ms = int((time.time() - t0) * 1000)

    out = out_bytes[:MAX_OUTPUT_BYTES].decode("utf-8", errors="replace")
    err = err_bytes[:MAX_OUTPUT_BYTES].decode("utf-8", errors="replace")
    truncated_out = len(out_bytes) > MAX_OUTPUT_BYTES
    truncated_err = len(err_bytes) > MAX_OUTPUT_BYTES

    # Walk artifacts dir, return file metadata. Files stay on disk so the
    # caller (or the frontend) can fetch them.
    arts: list[dict[str, Any]] = []
    if artifacts_dir.exists():
        for f in sorted(artifacts_dir.iterdir()):
            if f.is_file():
                arts.append(
                    {
                        "name": f.name,
                        "path": str(f),
                        "bytes": f.stat().st_size,
                    }
                )

    # We deliberately do NOT delete workdir if there are artifacts so the
    # frontend can pick them up. Caller is expected to GC periodically.
    if not arts:
        try:
            shutil.rmtree(workdir, ignore_errors=True)
        except Exception:
            pass

    return ExecResult(
        ok=(rc == 0 and not timed_out),
        elapsed_ms=elapsed_ms,
        stdout=out,
        stderr=err,
        artifacts=arts,
        return_code=rc,
        timeout=timed_out,
        truncated_stdout=truncated_out,
        truncated_stderr=truncated_err,
    )

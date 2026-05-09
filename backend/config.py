from pathlib import Path
import os

BACKEND_DIR = Path(__file__).resolve().parent
DATA_DIR = BACKEND_DIR / "data"
INDEX_PATH = DATA_DIR / "index.faiss"
META_PATH = DATA_DIR / "metadata.json"
STATE_PATH = DATA_DIR / "state.json"

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")
# gemma4:latest works out-of-the-box on this demo machine.
# Override with GEN_MODEL=gemma3:4b (faster, smaller) or qwen3:4b on richer tiers.
GEN_MODEL = os.getenv("GEN_MODEL", "gemma4:latest")
EMBED_DIM = 768

CHUNK_TOKENS = 512
CHUNK_OVERLAP = 64
TOP_K = 8

SUPPORTED_EXT = {".pdf", ".md", ".markdown", ".txt", ".docx"}

# Hard cap on files per index run — protects against runaway scans of huge home dirs.
MAX_FILES = int(os.getenv("ROVER_MAX_FILES", "3000"))

# Directory names to skip anywhere in the tree. Covers macOS system folders,
# common dev artifacts, virtual envs, caches, and large media folders that
# carry no useful semantic text for a document Finder.
EXCLUDE_DIR_NAMES = {
    # macOS user-folder dirs that aren't documents
    "Library", "Applications", "Movies", "Music", "Pictures", "Public",
    # macOS hidden / system
    ".Trash", ".Trashes", ".Spotlight-V100",
    ".DocumentRevisions-V100", ".fseventsd", ".TemporaryItems",
    # Dev artifacts
    "node_modules", "bower_components", "vendor",
    ".git", ".svn", ".hg", ".bzr",
    ".venv", "venv", "env", "ENV",
    "__pycache__", ".pytest_cache", ".mypy_cache", ".ruff_cache", ".tox",
    "target", "build", "dist", "out", "release",
    ".next", ".nuxt", ".svelte-kit", ".vite", ".turbo", ".parcel-cache",
    ".cache", ".npm", ".yarn", ".pnpm-store",
    ".idea", ".vscode",
    "Pods", "DerivedData",
}

DATA_DIR.mkdir(parents=True, exist_ok=True)

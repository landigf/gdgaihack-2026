from pathlib import Path
import os

BACKEND_DIR = Path(__file__).resolve().parent
DATA_DIR = BACKEND_DIR / "data"
INDEX_PATH = DATA_DIR / "index.faiss"
META_PATH = DATA_DIR / "metadata.json"

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")
GEN_MODEL = os.getenv("GEN_MODEL", "gemma3:4b")
EMBED_DIM = 768

CHUNK_TOKENS = 512
CHUNK_OVERLAP = 64
TOP_K = 8

SUPPORTED_EXT = {".pdf", ".md", ".markdown", ".txt", ".docx"}

DATA_DIR.mkdir(parents=True, exist_ok=True)

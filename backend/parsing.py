from pathlib import Path
from pypdf import PdfReader
from docx import Document


def _read_txt(p: Path) -> str:
    return p.read_text(encoding="utf-8", errors="ignore")


def _read_pdf(p: Path) -> str:
    reader = PdfReader(str(p))
    return "\n".join((page.extract_text() or "") for page in reader.pages)


def _read_docx(p: Path) -> str:
    doc = Document(str(p))
    return "\n".join(par.text for par in doc.paragraphs)


def parse_file(path: Path) -> str:
    ext = path.suffix.lower()
    if ext in {".txt", ".md", ".markdown"}:
        return _read_txt(path)
    if ext == ".pdf":
        return _read_pdf(path)
    if ext == ".docx":
        return _read_docx(path)
    return ""

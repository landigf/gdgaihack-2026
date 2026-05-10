# 06 — File-Type Routing

One endpoint (`/summarize`) handles every supported file type.
Routing is **all extension-driven** — no MIME sniffing, no magic
bytes. The decision flow:

```mermaid
flowchart TB
    REQ[/"POST /summarize<br/>&lbrace;path&rbrace;"/]
    EXT{path.suffix.lower&lpar;&rpar;}

    PDF["pypdf.PdfReader<br/>concat extract_text per page"]
    DOCX["python-docx<br/>join paragraphs"]
    XLSX["openpyxl read_only<br/>data_only=True<br/>cells joined by tab"]
    TXT["read_text utf-8<br/>errors=ignore"]
    CODE["read as utf-8 text<br/>(.py .js .ts .rs .go .java<br/>.json .yaml .toml …)"]
    IMG["base64-encode bytes<br/>send as images=&lpar;&lsqb;b64&rsqb;&rpar;"]
    SKIP[reject — 415]

    REQ --> EXT
    EXT -->|.pdf| PDF
    EXT -->|.docx| DOCX
    EXT -->|.xlsx| XLSX
    EXT -->|.txt .md .markdown .rtf| TXT
    EXT -->|in CODE_EXT| CODE
    EXT -->|in IMAGE_EXT| IMG
    EXT -->|other| SKIP

    PDF --> SUMM[summarizer_system]
    DOCX --> SUMM
    XLSX --> SUMM
    TXT --> SUMM
    CODE --> CSUMM[code_summarizer_system]
    IMG --> ISUMM[image_describer_system<br/>+ VISION_MODEL]

    SUMM --> LLM[state.generator]
    CSUMM --> LLM
    ISUMM --> OLL["state.embedder<br/>(OllamaClient)"]

    classDef ok fill:#064e3b,stroke:#34d399,color:#d1fae5
    classDef vision fill:#312e81,stroke:#a78bfa,color:#ede9fe
    classDef bad fill:#7f1d1d,stroke:#f87171,color:#fee2e2
    class PDF,DOCX,XLSX,TXT,CODE ok
    class IMG,ISUMM vision
    class SKIP bad
```

## Persona dispatch table

The reader fills `text` (or `images` for vision). The persona then
decides what kind of bullets come out.

| Extension family | Reader | Persona function | Output style |
|---|---|---|---|
| `.pdf .docx .txt .md .rtf` | text | `summarizer_system()` | 5–8 bullets, source-language |
| `.xlsx` | sheet-by-sheet TSV | `summarizer_system()` | 5–8 bullets, "this spreadsheet tracks…" |
| `.py .js .ts .rs .go .java .json .yaml …` | utf-8 text | `code_summarizer_system()` | 5–8 bullets, "what this file does" |
| `.png .jpg .webp .heic .gif .bmp .tiff .jpeg` | base64 bytes | `image_describer_system()` | 5–7 bullets, transcribe text verbatim |

## Why extension-driven and not MIME?

- The file is on the user's local disk. Extensions are reliable
  enough; the rare misnamed file (a JPEG saved as `.txt`) just
  gets parsed as text and produces a confused bullet list. Not
  a security boundary — Houston never executes the contents.
- MIME sniffing means reading the first N bytes of every file in
  the picker preview. That's I/O the OS already paid for; we
  don't redo it.

## Why XLSX as TSV instead of structured JSON?

The LLM doesn't need to know columns from rows; it needs the
**values**. Tab-separated cells with sheet headers as `# Sheet:`
markers parses cleanly in the model's prompt and uses ~30% fewer
tokens than equivalent JSON. Empty rows are skipped so the LLM
doesn't waste context on whitespace.

## What's NOT supported (yet)

- `.pptx`, `.key` — no parser. Open issue.
- `.epub` — would parse with `ebooklib`. Out of scope for hackathon.
- Images **embedded** inside docx / pdf — the text extraction
  ignores them. We'd need a docx → unzip → media folder pass.
- Encrypted PDFs — `pypdf` raises; we don't catch it explicitly.

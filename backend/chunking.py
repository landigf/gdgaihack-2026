import tiktoken

_ENC = tiktoken.get_encoding("cl100k_base")


def chunk_text(text: str, max_tokens: int = 512, overlap: int = 64) -> list[str]:
    text = text.strip()
    if not text:
        return []
    tokens = _ENC.encode(text)
    if len(tokens) <= max_tokens:
        return [text]
    step = max_tokens - overlap
    chunks: list[str] = []
    for start in range(0, len(tokens), step):
        chunks.append(_ENC.decode(tokens[start : start + max_tokens]))
        if start + max_tokens >= len(tokens):
            break
    return chunks

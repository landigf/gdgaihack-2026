from chunking import chunk_text


def test_short_text_one_chunk():
    chunks = chunk_text("hello world", max_tokens=512, overlap=64)
    assert chunks == ["hello world"]


def test_empty_returns_empty():
    assert chunk_text("", max_tokens=512, overlap=64) == []


def test_long_text_splits():
    body = " ".join(f"word{i}" for i in range(2000))
    chunks = chunk_text(body, max_tokens=100, overlap=20)
    assert len(chunks) > 1

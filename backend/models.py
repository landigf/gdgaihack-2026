from pydantic import BaseModel


class IndexRequest(BaseModel):
    folder: str


class IndexResponse(BaseModel):
    files_indexed: int
    chunks: int
    elapsed_ms: int


class SearchRequest(BaseModel):
    query: str
    top_k: int = 8


class SearchHit(BaseModel):
    path: str
    filename: str
    chunk_text: str
    chunk_index: int
    score: float


class SearchResponse(BaseModel):
    hits: list[SearchHit]
    elapsed_ms: int


class SummarizeRequest(BaseModel):
    path: str


class SummarizeResponse(BaseModel):
    summary: str
    elapsed_ms: int


class IndexState(BaseModel):
    indexed: bool
    root: str | None = None
    files: int | None = None
    chunks: int | None = None
    indexed_at_ms: int | None = None


class ModelInfo(BaseModel):
    name: str
    params: str | None = None
    quant: str | None = None


class ConfigResponse(BaseModel):
    gen: ModelInfo
    embed: ModelInfo
    backend: str = "ollama"  # 'ollama' or 'mlx' — drives status-bar suffix

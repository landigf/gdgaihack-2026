export type SearchHit = {
  path: string;
  filename: string;
  chunk_text: string;
  chunk_index: number;
  score: number;
};

export type SearchResponse = { hits: SearchHit[]; elapsed_ms: number };
export type IndexResponse = {
  files_indexed: number;
  chunks: number;
  elapsed_ms: number;
};
export type SummarizeResponse = { summary: string; elapsed_ms: number };

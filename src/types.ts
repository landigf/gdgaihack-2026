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

export type DirEntry = {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  modifiedMs: number;
  ext: string;
};

export type IndexState = {
  indexed: boolean;
  root?: string | null;
  files?: number | null;
  chunks?: number | null;
  indexed_at_ms?: number | null;
};

export type ModelInfo = {
  name: string;
  params?: string | null;
  quant?: string | null;
};

export type ConfigResponse = {
  gen: ModelInfo;
  embed: ModelInfo;
};

export type ClipboardOp = "copy" | "cut";
export type Clipboard = { paths: string[]; op: ClipboardOp } | null;

/** Anything the AI panel / actions can target — both browse entries and search hits. */
export type Selection =
  | { kind: "entry"; entry: DirEntry }
  | { kind: "hit"; hit: SearchHit };

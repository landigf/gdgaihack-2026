import type {
  IndexResponse,
  IndexState,
  SearchResponse,
  SummarizeResponse,
} from "./types";
import { tauri } from "./tauri";

let baseCache: string | null = null;

async function base(): Promise<string> {
  if (baseCache) return baseCache;
  baseCache = await tauri.backendUrl();
  return baseCache;
}

async function post<T>(path: string, body: unknown, timeoutMs = 60_000): Promise<T> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const r = await fetch(`${await base()}${path}`, {
      method: "POST",
      signal: ctl.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`${path} ${r.status}: ${await r.text()}`);
    return r.json() as Promise<T>;
  } finally {
    clearTimeout(t);
  }
}

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${await base()}${path}`);
  if (!r.ok) throw new Error(`${path} ${r.status}`);
  return r.json() as Promise<T>;
}

export const api = {
  health: () => get<{ ok: boolean }>("/health"),
  state: () => get<IndexState>("/state"),
  // Index can take a while on large home folders — generous timeout.
  index: (folder: string) =>
    post<IndexResponse>("/index", { folder }, 10 * 60_000),
  search: (query: string, top_k = 12) =>
    post<SearchResponse>("/search", { query, top_k }),
  summarize: (path: string) => post<SummarizeResponse>("/summarize", { path }),
};

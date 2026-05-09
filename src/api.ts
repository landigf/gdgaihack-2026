import type {
  ConfigResponse,
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

export type StreamCallbacks = {
  onDelta: (delta: string) => void;
  onDone?: () => void;
  signal?: AbortSignal;
};

/** Consume a Server-Sent-Events `text/event-stream` and call `onDelta` per
 *  payload. Returns when the stream ends or the signal aborts. Throws on
 *  HTTP error or `data: {error: "..."}` event. */
async function streamSSE(
  path: string,
  body: unknown,
  cb: StreamCallbacks
): Promise<void> {
  const r = await fetch(`${await base()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: cb.signal,
  });
  if (!r.ok) throw new Error(`${path} ${r.status}: ${await r.text()}`);
  if (!r.body) throw new Error(`${path}: empty response body`);

  const reader = r.body.getReader();
  const dec = new TextDecoder();
  let buffer = "";

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += dec.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n\n")) >= 0) {
      const event = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      for (const line of event.split("\n")) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6);
        if (payload === "[DONE]") {
          cb.onDone?.();
          return;
        }
        let obj: { delta?: string; error?: string };
        try {
          obj = JSON.parse(payload);
        } catch {
          continue;
        }
        if (obj.error) throw new Error(obj.error);
        if (obj.delta) cb.onDelta(obj.delta);
      }
    }
  }
  cb.onDone?.();
}

export const api = {
  health: () => get<{ ok: boolean }>("/health"),
  state: () => get<IndexState>("/state"),
  config: () => get<ConfigResponse>("/config"),
  // Index can take a while on large home folders — generous timeout.
  index: (folder: string) =>
    post<IndexResponse>("/index", { folder }, 10 * 60_000),
  search: (query: string, top_k = 12) =>
    post<SearchResponse>("/search", { query, top_k }),
  summarize: (path: string) => post<SummarizeResponse>("/summarize", { path }),
  summarizeStream: (path: string, cb: StreamCallbacks) =>
    streamSSE("/summarize/stream", { path }, cb),
};

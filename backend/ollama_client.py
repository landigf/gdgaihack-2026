import json
from typing import AsyncIterator

import httpx
from config import OLLAMA_HOST, EMBED_MODEL, GEN_MODEL


class OllamaClient:
    def __init__(
        self,
        host: str = OLLAMA_HOST,
        embed_model: str = EMBED_MODEL,
        gen_model: str = GEN_MODEL,
    ):
        self.host = host.rstrip("/")
        self.embed_model = embed_model
        self.gen_model = gen_model
        self._client = httpx.AsyncClient(timeout=120.0)

    async def embed(self, text: str) -> list[float]:
        r = await self._client.post(
            f"{self.host}/api/embeddings",
            json={"model": self.embed_model, "prompt": text},
        )
        r.raise_for_status()
        return r.json()["embedding"]

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:
        return [await self.embed(t) for t in texts]

    def _payload(self, prompt: str, system: str | None, stream: bool) -> dict:
        payload: dict = {
            "model": self.gen_model,
            "prompt": prompt,
            "stream": stream,
            "keep_alive": "30m",
            "think": False,
            "options": {
                "temperature": 0.3,
                "top_p": 0.9,
                "num_predict": 512,
                "num_ctx": 4096,
            },
        }
        if self.gen_model.startswith("qwen3"):
            payload["prompt"] = f"{prompt}\n\n/no_think"
        if system:
            payload["system"] = system
        return payload

    async def generate(self, prompt: str, system: str | None = None) -> str:
        r = await self._client.post(
            f"{self.host}/api/generate", json=self._payload(prompt, system, False)
        )
        r.raise_for_status()
        data = r.json()
        return (data.get("response") or data.get("thinking") or "").strip()

    async def generate_stream(
        self, prompt: str, system: str | None = None
    ) -> AsyncIterator[tuple[str, bool]]:
        """Yield (token_text, done) chunks. `done=True` on the final chunk
        (with empty text). Token-by-token from Ollama's JSONL stream.

        Used by SSE endpoints to drop perceived TTFT from full-response wait
        to first-token-latency. Same prompt path as `generate()` so the
        bytes-identical system prefix that enables KV-cache reuse stays intact.
        """
        async with self._client.stream(
            "POST",
            f"{self.host}/api/generate",
            json=self._payload(prompt, system, True),
        ) as r:
            r.raise_for_status()
            async for line in r.aiter_lines():
                if not line:
                    continue
                try:
                    data = json.loads(line)
                except json.JSONDecodeError:
                    continue
                chunk = data.get("response", "") or ""
                done = bool(data.get("done", False))
                if chunk or done:
                    yield chunk, done

    async def aclose(self) -> None:
        await self._client.aclose()

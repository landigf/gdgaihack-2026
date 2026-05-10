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

    def _generate_payload(
        self,
        prompt: str,
        system: str | None,
        *,
        model: str | None = None,
        images: list[str] | None = None,
    ) -> dict:
        chosen = model or self.gen_model
        payload: dict = {
            "model": chosen,
            "prompt": prompt,
            "keep_alive": "30m",
            "think": False,
            "options": {
                "temperature": 0.3,
                "top_p": 0.9,
                "num_predict": 512,
                "num_ctx": 4096,
            },
        }
        if chosen.startswith("qwen3"):
            payload["prompt"] = f"{prompt}\n\n/no_think"
        if system:
            payload["system"] = system
        # Vision: list of base64-encoded image bytes (no 'data:' prefix).
        # Ollama attaches them to the prompt for multimodal-capable models.
        if images:
            payload["images"] = images
            # Vision needs a bigger context budget for the image embedding.
            payload["options"]["num_predict"] = max(
                512, payload["options"].get("num_predict", 512)
            )
            payload["options"]["num_ctx"] = max(
                8192, payload["options"].get("num_ctx", 4096)
            )
        return payload

    async def generate(
        self,
        prompt: str,
        system: str | None = None,
        *,
        model: str | None = None,
        images: list[str] | None = None,
    ) -> str:
        payload = self._generate_payload(
            prompt, system, model=model, images=images
        )
        payload["stream"] = False
        r = await self._client.post(f"{self.host}/api/generate", json=payload)
        r.raise_for_status()
        data = r.json()
        return (data.get("response") or data.get("thinking") or "").strip()

    async def generate_stream(
        self,
        prompt: str,
        system: str | None = None,
        *,
        model: str | None = None,
        images: list[str] | None = None,
    ) -> AsyncIterator[str]:
        """Yield token deltas as Ollama produces them.

        Each Ollama NDJSON line carries either an incremental `response`
        chunk or `done: true`. We yield the chunk text and stop at done.
        Pass `model=` to use a different model than `self.gen_model`
        (e.g. switching to a vision model for image describe). Pass
        `images=[base64, ...]` for multimodal inputs.
        """
        payload = self._generate_payload(
            prompt, system, model=model, images=images
        )
        payload["stream"] = True
        async with self._client.stream(
            "POST", f"{self.host}/api/generate", json=payload
        ) as r:
            r.raise_for_status()
            async for line in r.aiter_lines():
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                except json.JSONDecodeError:
                    continue
                delta = obj.get("response") or obj.get("thinking") or ""
                if delta:
                    yield delta
                if obj.get("done"):
                    break

    async def aclose(self) -> None:
        await self._client.aclose()

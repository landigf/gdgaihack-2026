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

    async def generate(self, prompt: str, system: str | None = None) -> str:
        payload: dict = {
            "model": self.gen_model,
            "prompt": prompt,
            "stream": False,
            "keep_alive": "30m",
            "think": False,  # disable reasoning preamble across all thinking models
            "options": {
                "temperature": 0.3,
                "top_p": 0.9,
                "num_predict": 512,
                "num_ctx": 4096,
            },
        }
        # qwen3 also needs the in-prompt /no_think directive in addition to the flag
        if self.gen_model.startswith("qwen3"):
            payload["prompt"] = f"{prompt}\n\n/no_think"
        if system:
            payload["system"] = system
        r = await self._client.post(f"{self.host}/api/generate", json=payload)
        r.raise_for_status()
        data = r.json()
        return (data.get("response") or data.get("thinking") or "").strip()

    async def aclose(self) -> None:
        await self._client.aclose()

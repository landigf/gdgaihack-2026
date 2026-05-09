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
        payload: dict = {"model": self.gen_model, "prompt": prompt, "stream": False}
        if system:
            payload["system"] = system
        r = await self._client.post(f"{self.host}/api/generate", json=payload)
        r.raise_for_status()
        return r.json()["response"]

    async def aclose(self) -> None:
        await self._client.aclose()

import pytest
import httpx
from ollama_client import OllamaClient


@pytest.mark.asyncio
async def test_embed(monkeypatch):
    async def fake_post(self, url, json):
        return httpx.Response(
            200,
            json={"embedding": [0.1] * 768},
            request=httpx.Request("POST", url),
        )

    monkeypatch.setattr(httpx.AsyncClient, "post", fake_post)
    v = await OllamaClient(host="http://x").embed("hello")
    assert len(v) == 768


@pytest.mark.asyncio
async def test_generate(monkeypatch):
    async def fake_post(self, url, json):
        return httpx.Response(
            200,
            json={"response": "ok"},
            request=httpx.Request("POST", url),
        )

    monkeypatch.setattr(httpx.AsyncClient, "post", fake_post)
    out = await OllamaClient(host="http://x").generate("hi")
    assert out == "ok"

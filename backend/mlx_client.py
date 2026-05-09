"""MLX-LM in-process generation client.

Holds an MLX model + tokenizer in unified memory across calls — no IPC
to a separate Ollama process, weights stay hot. Apple Silicon only.

Generation interface intentionally matches OllamaClient so main.py can
treat them as drop-in alternates:
    .generate(prompt, system) -> str
    .generate_stream(prompt, system) -> AsyncIterator[str]

Embeddings are NOT handled here — Ollama's nomic-embed-text remains the
embedder for now (MLX-LM is generation-focused; switching the embedder
would invalidate every persisted FAISS index).
"""

from __future__ import annotations

import asyncio
import os
from typing import AsyncIterator

# Lazy import: only succeeds on Apple Silicon with MLX wheels installed.
# Importing at module load means main.py's try/except in _build_generator
# catches the platform check before we ever instantiate MLXClient.
from mlx_lm import generate as mlx_generate, load as mlx_load  # type: ignore[import-not-found]
from mlx_lm.sample_utils import make_sampler  # type: ignore[import-not-found]


DEFAULT_MODEL = os.getenv("MLX_MODEL", "mlx-community/Qwen2.5-3B-Instruct-4bit")


def _format_chat(prompt: str, system: str | None) -> str:
    """Render a Qwen-family chat template manually.

    We could pull tokenizer.apply_chat_template, but a hardcoded template
    avoids any per-tokenizer drift and matches what Ollama feeds the
    same model under the hood. If we change model families later, swap
    this function.
    """
    sys_block = (
        f"<|im_start|>system\n{system}<|im_end|>\n" if system else ""
    )
    return (
        f"{sys_block}"
        f"<|im_start|>user\n{prompt}<|im_end|>\n"
        f"<|im_start|>assistant\n"
    )


class MLXClient:
    """Drop-in for OllamaClient, generation only.

    Loaded lazily on first call; subsequent calls reuse the cached model.
    """

    def __init__(self, model_name: str = DEFAULT_MODEL) -> None:
        self.model_name = model_name
        self._model = None
        self._tokenizer = None
        # Concurrent generate() calls would step on each other's KV state.
        # Serialize with an asyncio lock — Python is the bottleneck anyway.
        self._lock = asyncio.Lock()

    def _ensure_loaded(self) -> None:
        if self._model is None:
            self._model, self._tokenizer = mlx_load(self.model_name)

    async def generate(self, prompt: str, system: str | None = None) -> str:
        text = _format_chat(prompt, system)
        async with self._lock:
            self._ensure_loaded()
            sampler = make_sampler(temp=0.3, top_p=0.9)

            def _run() -> str:
                return mlx_generate(
                    self._model,
                    self._tokenizer,
                    prompt=text,
                    max_tokens=512,
                    sampler=sampler,
                    verbose=False,
                )

            # mlx_generate is CPU/GPU-bound and blocks; off-thread it.
            return (await asyncio.to_thread(_run)).strip()

    async def generate_stream(
        self, prompt: str, system: str | None = None
    ) -> AsyncIterator[str]:
        """Yield token deltas as MLX produces them.

        mlx_lm.stream_generate is a sync iterator; we drain it in a
        worker thread and bridge each token to the asyncio loop via a
        queue, so the FastAPI handler stays responsive.
        """
        from mlx_lm import stream_generate as mlx_stream  # type: ignore[import-not-found]

        text = _format_chat(prompt, system)
        sampler = make_sampler(temp=0.3, top_p=0.9)
        queue: asyncio.Queue[str | None] = asyncio.Queue()
        loop = asyncio.get_running_loop()

        async with self._lock:
            self._ensure_loaded()

            def _worker() -> None:
                try:
                    for resp in mlx_stream(
                        self._model,
                        self._tokenizer,
                        prompt=text,
                        max_tokens=512,
                        sampler=sampler,
                    ):
                        # mlx_lm versions vary: older returns str, newer
                        # returns a GenerationResponse with .text
                        delta = getattr(resp, "text", None)
                        if delta is None:
                            delta = str(resp)
                        if delta:
                            loop.call_soon_threadsafe(queue.put_nowait, delta)
                finally:
                    loop.call_soon_threadsafe(queue.put_nowait, None)

            task = asyncio.create_task(asyncio.to_thread(_worker))

            try:
                while True:
                    item = await queue.get()
                    if item is None:
                        break
                    yield item
            finally:
                await task

    async def aclose(self) -> None:
        # Nothing to close — model lives until process exits.
        return None

"""MLX-LM in-process client. Drop-in replacement for OllamaClient's
generation interface (`generate` + `generate_stream`); embeddings stay on
Ollama (nomic-embed-text is tiny, no MLX gain).

Why in-process: avoids a second server, lets the FastAPI sidecar share
the model weights once, and matches the Codex spec's prompt-cache reuse
goal — the same model object holds the KV cache for the bytes-identical
system prefix used by all four Houston personas.

Loaded lazily so the import does not block the app on a missing model.
"""
from __future__ import annotations

import asyncio
import os
import time
from typing import AsyncIterator


# Defaults match the Codex optimization spec. Override via env.
DEFAULT_PRIMARY = os.environ.get(
    "MLX_PRIMARY_MODEL", "mlx-community/Qwen2.5-7B-Instruct-4bit"
)
DEFAULT_DRAFT = os.environ.get("MLX_DRAFT_MODEL", "")  # disabled unless set
DEFAULT_NUM_DRAFT_TOKENS = int(os.environ.get("MLX_NUM_DRAFT_TOKENS", "0"))


class MLXClient:
    """Same surface as OllamaClient.generate / generate_stream. Embeddings
    are NOT implemented here — keep using OllamaClient for embeddings."""

    def __init__(
        self,
        model_id: str = DEFAULT_PRIMARY,
        draft_model_id: str = DEFAULT_DRAFT,
        num_draft_tokens: int = DEFAULT_NUM_DRAFT_TOKENS,
        max_tokens: int = 512,
        temperature: float = 0.3,
        top_p: float = 0.9,
    ):
        # Import locally so the module can be imported without mlx_lm
        # installed (we want the app to fall back to Ollama gracefully).
        from mlx_lm import load
        from mlx_lm.sample_utils import make_sampler

        self.model_id = model_id
        self.draft_model_id = draft_model_id
        self.num_draft_tokens = num_draft_tokens
        self.max_tokens = max_tokens
        self.temperature = temperature
        self.top_p = top_p

        # Primary load (4.3GB for Qwen2.5-7B-4bit). Blocks; mitigated by
        # main.py loading at startup and by the lazy-import above.
        self.model, self.tokenizer = load(model_id)

        self.draft_model = None
        if draft_model_id:
            try:
                draft_model, _ = load(draft_model_id)
                self.draft_model = draft_model
            except Exception:
                self.draft_model = None

        self._sampler = make_sampler(temp=temperature, top_p=top_p)
        # Backwards-compat shim — some downstream code may peek at this.
        self.gen_model = model_id

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _format_prompt(self, prompt: str, system: str | None) -> str:
        """Apply the model's chat template so the bytes-identical system
        prefix shared by Houston's 4 personas survives intact for KV-cache
        reuse. Falls back to a simple <|system|>/<|user|> wrap if the
        tokenizer has no template (rare for instruct models)."""
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})
        try:
            return self.tokenizer.apply_chat_template(
                messages, tokenize=False, add_generation_prompt=True
            )
        except Exception:
            sys_block = f"<|system|>\n{system}\n" if system else ""
            return f"{sys_block}<|user|>\n{prompt}\n<|assistant|>\n"

    def _generate_blocking(self, prompt: str, system: str | None) -> str:
        from mlx_lm import generate as mlx_generate

        text = self._format_prompt(prompt, system)
        kwargs = dict(
            model=self.model,
            tokenizer=self.tokenizer,
            prompt=text,
            max_tokens=self.max_tokens,
            sampler=self._sampler,
            verbose=False,
        )
        if self.draft_model is not None and self.num_draft_tokens > 0:
            kwargs["draft_model"] = self.draft_model
            kwargs["num_draft_tokens"] = self.num_draft_tokens
        return mlx_generate(**kwargs)

    # ------------------------------------------------------------------
    # Public surface
    # ------------------------------------------------------------------

    async def generate(self, prompt: str, system: str | None = None) -> str:
        """Block-wait for full generation. Run in a thread so the event
        loop stays responsive — MLX itself releases the GIL during the
        Metal kernels."""
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(
            None, self._generate_blocking, prompt, system
        )

    async def generate_stream(
        self, prompt: str, system: str | None = None
    ) -> AsyncIterator[tuple[str, bool]]:
        """Yield (token_text, done) chunks. Same shape as
        OllamaClient.generate_stream so the SSE endpoint can swap clients
        without touching the wire format."""
        from mlx_lm import stream_generate

        text = self._format_prompt(prompt, system)
        kwargs = dict(
            model=self.model,
            tokenizer=self.tokenizer,
            prompt=text,
            max_tokens=self.max_tokens,
            sampler=self._sampler,
        )
        if self.draft_model is not None and self.num_draft_tokens > 0:
            kwargs["draft_model"] = self.draft_model
            kwargs["num_draft_tokens"] = self.num_draft_tokens

        # stream_generate is a sync iterator. Pump it via run_in_executor
        # so the FastAPI loop is never blocked between tokens. We bridge by
        # collecting tokens in a queue.
        queue: asyncio.Queue = asyncio.Queue(maxsize=64)
        loop = asyncio.get_running_loop()
        SENTINEL = object()

        def _producer():
            try:
                for chunk in stream_generate(**kwargs):
                    # mlx_lm yields objects with `.text` (and `.token`)
                    text_piece = getattr(chunk, "text", None)
                    if text_piece is None:
                        text_piece = str(chunk)
                    asyncio.run_coroutine_threadsafe(
                        queue.put(("chunk", text_piece)), loop
                    ).result()
            except Exception as e:
                asyncio.run_coroutine_threadsafe(
                    queue.put(("error", str(e))), loop
                ).result()
            finally:
                asyncio.run_coroutine_threadsafe(queue.put(SENTINEL), loop).result()

        loop.run_in_executor(None, _producer)

        while True:
            item = await queue.get()
            if item is SENTINEL:
                yield "", True
                return
            kind, payload = item
            if kind == "error":
                # Surface as a final marker; caller can detect via empty + done.
                yield "", True
                return
            if payload:
                yield payload, False

    # ------------------------------------------------------------------
    # Embeddings — NOT implemented. Keep using OllamaClient for embeddings.
    # ------------------------------------------------------------------

    async def embed(self, text: str) -> list[float]:  # pragma: no cover
        raise NotImplementedError(
            "MLXClient does not implement embeddings. Use OllamaClient for embed."
        )

    async def embed_batch(self, texts: list[str]) -> list[list[float]]:  # pragma: no cover
        raise NotImplementedError(
            "MLXClient does not implement embeddings. Use OllamaClient for embed."
        )

    async def aclose(self) -> None:
        # Nothing to close — model lives in-process for the app lifetime.
        return None

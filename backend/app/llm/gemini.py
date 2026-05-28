from __future__ import annotations

import asyncio
from typing import AsyncIterator, Literal

import google.generativeai as genai

from app.llm.base import Chunk, Message


class GeminiClient:
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("Gemini API key is missing. Configure it in settings.")
        genai.configure(api_key=api_key)

    async def chat(
        self,
        messages: list[Message],
        model: str,
        temperature: float = 0.7,
        response_format: Literal["text", "json"] = "text",
        stream: bool = True,
    ) -> AsyncIterator[Chunk]:
        system_parts = [m.content for m in messages if m.role == "system"]
        history: list[dict] = []
        for m in messages:
            if m.role == "system":
                continue
            role = "user" if m.role == "user" else "model"
            history.append({"role": role, "parts": [m.content]})

        gen_config: dict = {"temperature": temperature}
        if response_format == "json":
            gen_config["response_mime_type"] = "application/json"

        gm = genai.GenerativeModel(
            model_name=model,
            system_instruction="\n\n".join(system_parts) if system_parts else None,
            generation_config=gen_config,
        )

        loop = asyncio.get_running_loop()

        if not stream:
            resp = await loop.run_in_executor(None, lambda: gm.generate_content(history))
            yield Chunk(text=resp.text or "")
            return

        # Gemini's stream is a sync generator; pump it through a queue.
        queue: asyncio.Queue = asyncio.Queue()
        SENTINEL = object()

        def producer():
            try:
                stream_iter = gm.generate_content(history, stream=True)
                for piece in stream_iter:
                    text = getattr(piece, "text", None) or ""
                    if text:
                        loop.call_soon_threadsafe(queue.put_nowait, text)
            except Exception as e:  # noqa: BLE001
                loop.call_soon_threadsafe(queue.put_nowait, e)
            finally:
                loop.call_soon_threadsafe(queue.put_nowait, SENTINEL)

        # Schedule producer in default executor without awaiting it.
        loop.run_in_executor(None, producer)

        while True:
            item = await queue.get()
            if item is SENTINEL:
                return
            if isinstance(item, Exception):
                raise item
            yield Chunk(text=item)

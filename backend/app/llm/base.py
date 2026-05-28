from __future__ import annotations

from dataclasses import dataclass
from typing import AsyncIterator, Literal, Protocol


@dataclass
class Message:
    role: Literal["system", "user", "assistant"]
    content: str


@dataclass
class Chunk:
    text: str


class LLMClient(Protocol):
    async def chat(
        self,
        messages: list[Message],
        model: str,
        temperature: float = 0.7,
        response_format: Literal["text", "json"] = "text",
        stream: bool = True,
    ) -> AsyncIterator[Chunk]: ...

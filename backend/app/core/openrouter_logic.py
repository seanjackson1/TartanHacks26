"""OpenRouter embedding logic using intfloat/e5-large-v2 (1024 dimensions)."""

from __future__ import annotations

from typing import Iterable, List

from openai import OpenAI

from app.config import settings

MODEL_NAME = "intfloat/e5-large-v2"


def _client() -> OpenAI:
    return OpenAI(
        api_key=settings.openrouter_api_key,
        base_url=settings.openrouter_base_url,
        default_headers={
            # Optional but recommended by OpenRouter for analytics.
            "HTTP-Referer": "http://localhost",
            "X-Title": "Global Mosaic",
        },
    )


def get_embedding(dna_string: str) -> List[float]:
    """Return a single embedding for the provided dna_string."""
    if not dna_string or not dna_string.strip():
        raise ValueError("dna_string must be a non-empty string.")

    client = _client()
    response = client.embeddings.create(model=MODEL_NAME, input=dna_string)
    return response.data[0].embedding


def get_embeddings(texts: Iterable[str]) -> List[List[float]]:
    """Return embeddings for a batch of strings."""
    batch = [t for t in texts if t and t.strip()]
    if not batch:
        raise ValueError("texts must contain at least one non-empty string.")

    client = _client()
    response = client.embeddings.create(model=MODEL_NAME, input=batch)
    return [item.embedding for item in response.data]

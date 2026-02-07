"""OpenRouter embedding and text generation logic."""

from __future__ import annotations

from typing import Iterable, List

from openai import OpenAI

from app.config import settings

EMBED_MODEL = "intfloat/e5-large-v2"
TEXT_MODEL = "openai/gpt-4o-mini"


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
    response = client.embeddings.create(model=EMBED_MODEL, input=dna_string)
    return response.data[0].embedding


def get_embeddings(texts: Iterable[str]) -> List[List[float]]:
    """Return embeddings for a batch of strings."""
    batch = [t for t in texts if t and t.strip()]
    if not batch:
        raise ValueError("texts must contain at least one non-empty string.")

    client = _client()
    response = client.embeddings.create(model=EMBED_MODEL, input=batch)
    return [item.embedding for item in response.data]


def generate_profile_summary(
    *,
    username: str,
    bio: str | None,
    interests: list[str],
    youtube_interests: list[str],
    steam_interests: list[str],
    discord_interests: list[str] | None = None,
) -> str:
    """Generate a short natural-language profile summary for dna_string."""
    client = _client()
    system = (
        "You are a helpful assistant that writes a neutral profile summary paragraph. "
        "Return a single paragraph of 4-6 sentences, no bullet points, no emojis."
    )
    user = {
        "username": username,
        "bio": bio,
        "interests": interests[:30],
        "youtube_interests": youtube_interests[:30],
        "steam_interests": steam_interests[:30],
        "discord_interests": (discord_interests or [])[:30],
    }
    response = client.chat.completions.create(
        model=TEXT_MODEL,
        temperature=0.2,
        messages=[
            {"role": "system", "content": system},
            {
                "role": "user",
                "content": (
                "Write a profile summary paragraph based on this data:\n"
                    f"{user}"
                ),
            },
        ],
    )
    content = response.choices[0].message.content or ""
    return content.strip()


def generate_similarity_summary(dna_string_1: str, dna_string_2: str) -> str:
    """Generate a 1-sentence summary of what two users have in common.
    
    Args:
        dna_string_1: First user's profile DNA string
        dna_string_2: Second user's profile DNA string
    
    Returns:
        A short sentence describing shared interests/traits
    """
    if not dna_string_1 or not dna_string_2:
        return "You both share similar interests."
    
    client = _client()
    system = (
        "You are a helpful assistant. Given two user profiles, write a short sentence "
        "describing what they SPECIFICALLY have in common. You MUST name 2-3 actual shared "
        "interests, games, channels, or hobbies from their profiles. Do NOT be generic or vague. "
        "Bad: 'You both enjoy gaming and YouTube content.' "
        "Good: 'You both are into Counter-Strike, watch MrBeast, and enjoy hiking.' "
        "Start with 'You both' and keep it under 20 words."
    )
    
    response = client.chat.completions.create(
        model=TEXT_MODEL,
        temperature=0.4,
        max_tokens=80,
        messages=[
            {"role": "system", "content": system},
            {
                "role": "user",
                "content": (
                    f"User 1: {dna_string_1}\n\n"
                    f"User 2: {dna_string_2}\n\n"
                    "What do they have in common?"
                ),
            },
        ],
    )
    content = response.choices[0].message.content or ""
    return content.strip()


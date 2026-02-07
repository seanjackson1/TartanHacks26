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


def generate_similarity_summary(interests_1: list[str], interests_2: list[str]) -> str:
    """Generate a 1-sentence summary of what two users have in common.
    
    Args:
        interests_1: First user's all_interests list
        interests_2: Second user's all_interests list
    
    Returns:
        A short sentence describing shared interests/traits
    """
    if not interests_1 or not interests_2:
        return "You both share similar interests."
    
    # Truncate long lists to avoid token limits
    interests_1_str = ", ".join(interests_1[:40])
    interests_2_str = ", ".join(interests_2[:40])
    
    client = _client()
    system = (
        "You are a helpful assistant comparing two users' interests. Write a friendly, medium-length "
        "sentence (20-35 words) about what they have in common. "
        "PRIORITY ORDER for matches: "
        "1) Same games (e.g. both have 'Terraria' or 'Counter-Strike') - great conversation starters! "
        "2) Same Discord servers (e.g. both in 'CMU Esports') - they might already know each other! "
        "3) Same YouTube channels/subscriptions (e.g. both watch 'FitnessFAQs') "
        "4) Same hobbies (e.g. both like 'hiking' or 'calisthenics') "
        "Name 2-4 SPECIFIC shared items from their lists. Do NOT be generic. "
        "Start with 'You both' and mention why these matches could spark a connection."
    )
    
    response = client.chat.completions.create(
        model=TEXT_MODEL,
        temperature=0.4,
        max_tokens=100,
        messages=[
            {"role": "system", "content": system},
            {
                "role": "user",
                "content": (
                    f"User 1 interests: {interests_1_str}\n\n"
                    f"User 2 interests: {interests_2_str}\n\n"
                    "What specific things do they have in common?"
                ),
            },
        ],
    )
    content = response.choices[0].message.content or ""
    return content.strip()



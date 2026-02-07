"""
Test Embedding Similarity with Ollama (embeddinggemma)

Tests whether the embedding model correctly identifies that Minecraft
is more similar to Terraria than to Call of Duty.
"""

import os
from dotenv import load_dotenv
import ollama

# Load environment variables from .env file
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

OLLAMA_HOST = os.getenv('OLLAMA_HOST', 'http://localhost:11434')
MODEL_NAME = 'embeddinggemma'


def cosine_similarity(vec1: list[float], vec2: list[float]) -> float:
    """Calculate cosine similarity between two vectors."""
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    magnitude1 = sum(a * a for a in vec1) ** 0.5
    magnitude2 = sum(b * b for b in vec2) ** 0.5
    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0
    return dot_product / (magnitude1 * magnitude2)


def get_embedding(client: ollama.Client, text: str) -> list[float]:
    """Get embedding for a text using Ollama."""
    response = client.embed(model=MODEL_NAME, input=[text])
    return response['embeddings'][0]


def main():
    print(f"Connecting to Ollama at: {OLLAMA_HOST}")
    print(f"Using model: {MODEL_NAME}")
    print("-" * 50)
    
    # Initialize Ollama client
    client = ollama.Client(host=OLLAMA_HOST)
    
    # Test games
    games = ["Minecraft", "Terraria", "Call of Duty"]
    
    # Get embeddings for each game
    print("\nGenerating embeddings...")
    embeddings = {}
    for game in games:
        embeddings[game] = get_embedding(client, game)
        print(f"  ✅ Got embedding for '{game}' (dim={len(embeddings[game])})")
    
    # Calculate pairwise similarity scores
    print("\n" + "=" * 50)
    print("SIMILARITY SCORES")
    print("=" * 50)
    
    pairs = [
        ("Minecraft", "Terraria"),
        ("Minecraft", "Call of Duty"),
        ("Terraria", "Call of Duty"),
    ]
    
    results = {}
    for game1, game2 in pairs:
        similarity = cosine_similarity(embeddings[game1], embeddings[game2])
        results[(game1, game2)] = similarity
        print(f"  {game1} <-> {game2}: {similarity:.4f}")
    
    # Analysis
    print("\n" + "=" * 50)
    print("ANALYSIS")
    print("=" * 50)
    
    minecraft_terraria = results[("Minecraft", "Terraria")]
    minecraft_cod = results[("Minecraft", "Call of Duty")]
    
    if minecraft_terraria > minecraft_cod:
        print("  ✅ SUCCESS: Minecraft is MORE similar to Terraria than to Call of Duty")
        print(f"     Difference: {minecraft_terraria - minecraft_cod:.4f}")
    else:
        print("  ❌ UNEXPECTED: Minecraft is more similar to Call of Duty than to Terraria")
        print(f"     Difference: {minecraft_cod - minecraft_terraria:.4f}")
    
    print("\n" + "=" * 50)
    print("INTERPRETATION")
    print("=" * 50)
    print("  Minecraft and Terraria are both sandbox/survival games with")
    print("  block-based building and exploration mechanics.")
    print("  Call of Duty is a first-person shooter focused on combat.")
    print("  A good embedding model should recognize the semantic similarity")
    print("  between the sandbox games vs the shooter.")


if __name__ == "__main__":
    main()

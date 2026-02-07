#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import random
import time
from pathlib import Path

OUTPUT_PATH = Path(os.getenv("SEED_JSON_PATH", "backend/scripts/data/seed_data.json"))
RANDOM_SEED = int(os.getenv("SEED_RANDOM_SEED", "42"))


def _make_interest_pool(n: int) -> list[str]:
    topics = [
        "AI",
        "machine learning",
        "robotics",
        "web development",
        "cybersecurity",
        "data science",
        "blockchain",
        "climate tech",
        "space",
        "biotech",
        "graphic design",
        "digital art",
        "photography",
        "music production",
        "indie music",
        "film",
        "gaming",
        "esports",
        "fitness",
        "running",
        "hiking",
        "cooking",
        "travel",
        "language learning",
        "startups",
        "fintech",
        "AR/VR",
        "education",
        "sports analytics",
        "psychology",
    ]
    modifiers = [
        "beginner",
        "advanced",
        "tips",
        "projects",
        "news",
        "trends",
        "tools",
        "community",
        "workflow",
        "best practices",
        "deep dive",
        "guide",
        "course",
        "ideas",
        "patterns",
    ]
    out = []
    for _ in range(n):
        out.append(f"{random.choice(topics)} {random.choice(modifiers)}")
    return out


def _make_game_titles(n: int) -> list[str]:
    adjectives = [
        "Eternal",
        "Neon",
        "Shadow",
        "Crimson",
        "Frost",
        "Iron",
        "Nova",
        "Silent",
        "Arcane",
        "Quantum",
        "Solar",
        "Titan",
        "Hollow",
        "Stellar",
        "Violet",
        "Rogue",
        "Mythic",
        "Wild",
        "Lost",
        "Final",
    ]
    nouns = [
        "Frontier",
        "Odyssey",
        "Citadel",
        "Voyage",
        "Horizon",
        "Drift",
        "Siege",
        "Echoes",
        "Legacy",
        "Realm",
        "Forge",
        "Rift",
        "Sanctum",
        "Pulse",
        "Crown",
        "Protocol",
        "Crusade",
        "Origins",
        "Abyss",
        "Signal",
    ]
    genres = [
        "Arena",
        "Survival",
        "Tactics",
        "Racing",
        "Dungeon",
        "RPG",
        "Skies",
        "Expedition",
        "Quest",
        "Chronicles",
    ]
    out = []
    for _ in range(n):
        title = f"{random.choice(adjectives)} {random.choice(nouns)}"
        if random.random() < 0.4:
            title = f"{title}: {random.choice(genres)}"
        out.append(title)
    return out


def _make_youtube_titles(n: int) -> list[str]:
    starts = [
        "I Tried",
        "We Tested",
        "How To",
        "Why",
        "Top 10",
        "The Truth About",
        "Beginner’s Guide to",
        "A Day With",
        "Building",
        "Explained:",
        "Reviewing",
        "Reacting to",
        "Designing",
        "Ranking",
        "Speedrunning",
    ]
    subjects = [
        "AI Tools",
        "Indie Games",
        "Minimalist Workflows",
        "Street Photography",
        "Home Workouts",
        "Budget Travel",
        "My Coding Setup",
        "Game Development",
        "Space Mysteries",
        "Cybersecurity Myths",
        "Music Production",
        "Creative Writing",
        "Data Science Projects",
        "Film Editing",
        "UX Case Studies",
    ]
    endings = [
        "in 24 Hours",
        "You Can Do Today",
        "for Beginners",
        "That Actually Work",
        "— Full Tutorial",
        "Gone Wrong",
        "on a Budget",
        "with No Experience",
        "Like a Pro",
        "Everyone Gets Wrong",
    ]
    out = []
    for _ in range(n):
        title = f"{random.choice(starts)} {random.choice(subjects)}"
        if random.random() < 0.6:
            title = f"{title} {random.choice(endings)}"
        out.append(title)
    return out


def main() -> None:
    random.seed(RANDOM_SEED)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    general_pool = _make_interest_pool(1000)
    steam_pool = _make_game_titles(1000)
    youtube_pool = _make_youtube_titles(1000)

    first_names = [
        "Alex",
        "Jordan",
        "Taylor",
        "Morgan",
        "Riley",
        "Casey",
        "Jamie",
        "Avery",
        "Parker",
        "Quinn",
        "Cameron",
        "Drew",
        "Kai",
        "Rowan",
        "Sage",
        "Logan",
        "Emerson",
        "Skyler",
        "Harper",
        "Reese",
        "Elliot",
        "Finley",
        "Noah",
        "Liam",
        "Mia",
        "Ava",
        "Zoe",
        "Luna",
        "Sofia",
        "Ethan",
        "Aria",
        "Leo",
        "Nora",
        "Mason",
        "Isla",
        "Owen",
        "Ivy",
        "Elijah",
        "Chloe",
        "Lucas",
    ]
    last_names = [
        "Nguyen",
        "Patel",
        "Kim",
        "Garcia",
        "Smith",
        "Johnson",
        "Brown",
        "Lee",
        "Martinez",
        "Taylor",
        "Anderson",
        "Thomas",
        "Moore",
        "Jackson",
        "Martin",
        "Thompson",
        "White",
        "Lopez",
        "Gonzalez",
        "Clark",
        "Lewis",
        "Robinson",
        "Walker",
        "Young",
        "Allen",
        "King",
        "Wright",
        "Scott",
        "Green",
        "Baker",
        "Adams",
        "Nelson",
        "Hill",
        "Ramirez",
        "Campbell",
        "Mitchell",
        "Perez",
        "Roberts",
        "Turner",
        "Phillips",
    ]
    email_domains = ["gmail.com"]

    users = []
    seen_handles = set()
    seen_emails = set()
    for i in range(1000):
        while True:
            first = random.choice(first_names)
            last = random.choice(last_names)
            handle = f"{first.lower()}.{last.lower()}{random.randint(1,999)}"
            email = f"{handle}@{random.choice(email_domains)}"
            if handle not in seen_handles and email not in seen_emails:
                seen_handles.add(handle)
                seen_emails.add(email)
                break
        display_name = f"{first} {last}"
        bios = [
            "Curious about tech, design, and people.",
            "Exploring new ideas through projects and stories.",
            "Builder by day, gamer by night.",
            "Always learning-currently into AI and maps.",
            "Coffee, code, and long walks.",
            "Music, motion, and meaningful connections.",
            "Trying to make the world a little more connected.",
            "Enthusiast of games, fitness, and good conversations.",
            "Creative problem-solver and lifelong learner.",
            "Interested in startups, science, and community.",
            "Photographer who loves data and travel.",
            "Designing systems and exploring new places.",
            "Low-key competitive, high-key curious.",
            "Collecting ideas, not things.",
            "Part engineer, part artist.",
        ]
        insta_tag = f"@{handle}"
        users.append(
            {
                "display_name": display_name,
                "username": handle,
                "email": email,
                "instagram_handle": insta_tag,
                "bio": random.choice(bios),
            }
        )

    payload = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "users": users,
        "general_pool": general_pool,
        "steam_pool": steam_pool,
        "youtube_pool": youtube_pool,
        "sources": {
            "general": "synthetic (plausible interests)",
            "steam": "synthetic (plausible game titles)",
            "youtube": "synthetic (plausible video titles)",
        },
    }

    OUTPUT_PATH.write_text(json.dumps(payload, indent=2))
    print(f"Wrote seed data to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

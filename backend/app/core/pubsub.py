"""
Redis Pub/Sub wrapper for real-time message fanout.
"""

from __future__ import annotations

import asyncio
import json
from typing import Any, AsyncGenerator

import redis.asyncio as aioredis

from app.config import settings


async def get_redis() -> aioredis.Redis:
    """Get async Redis connection."""
    return await aioredis.from_url(settings.redis_url, decode_responses=True)


async def publish_message(user_id: str, message_data: dict[str, Any]) -> int:
    """
    Publish a message to a user's chat channel.
    
    Args:
        user_id: The recipient user's ID
        message_data: The message payload to publish
        
    Returns:
        Number of subscribers that received the message
    """
    redis = await get_redis()
    try:
        channel = f"chat:{user_id}"
        payload = json.dumps(message_data)
        return await redis.publish(channel, payload)
    finally:
        await redis.aclose()


async def subscribe_user(user_id: str) -> AsyncGenerator[dict[str, Any], None]:
    """
    Subscribe to a user's chat channel and yield incoming messages.
    
    Args:
        user_id: The user ID to subscribe for
        
    Yields:
        Message dictionaries as they arrive
    """
    redis = await get_redis()
    pubsub = redis.pubsub()
    channel = f"chat:{user_id}"
    
    try:
        await pubsub.subscribe(channel)
        
        while True:
            message = await pubsub.get_message(
                ignore_subscribe_messages=True, 
                timeout=1.0
            )
            if message and message["type"] == "message":
                try:
                    data = json.loads(message["data"])
                    yield data
                except json.JSONDecodeError:
                    continue
            else:
                # Yield control to allow cancellation
                await asyncio.sleep(0.01)
    finally:
        await pubsub.unsubscribe(channel)
        await pubsub.aclose()
        await redis.aclose()

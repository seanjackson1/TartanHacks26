"""
Messaging routes: WebSocket for real-time chat + REST for history.
"""

from __future__ import annotations

import asyncio
import json
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, HTTPException
from pydantic import BaseModel

from app.core.pubsub import publish_message, subscribe_user
from app.db.supabase_client import insert_message, get_messages_between, get_profile_by_id


router = APIRouter(prefix="/messages", tags=["messaging"])


class SendMessageRequest(BaseModel):
    sender_id: str
    receiver_id: str
    content: str


class MessageResponse(BaseModel):
    id: str
    sender_id: str
    receiver_id: str
    content: str
    created_at: str
    read_at: str | None = None


# Store active WebSocket connections: user_id -> WebSocket
active_connections: dict[str, WebSocket] = {}


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: str,
):
    """
    WebSocket endpoint for real-time messaging.
    Clients connect here to receive live message updates.
    """
    await websocket.accept()
    active_connections[user_id] = websocket
    
    # Start listening for Redis pub/sub messages
    subscription_task = None
    try:
        async def forward_messages():
            async for message in subscribe_user(user_id):
                try:
                    await websocket.send_json(message)
                except Exception:
                    break
        
        subscription_task = asyncio.create_task(forward_messages())
        
        # Keep the connection alive and handle incoming messages from client
        while True:
            try:
                # Receive messages from client (for sending)
                data = await websocket.receive_json()
                
                if data.get("type") == "send":
                    receiver_id = data.get("receiver_id")
                    content = data.get("content")
                    
                    if receiver_id and content:
                        # Persist to database
                        saved_msg = insert_message(
                            sender_id=user_id,
                            receiver_id=receiver_id,
                            content=content,
                        )
                        
                        # Prepare message payload
                        msg_payload = {
                            "type": "new_message",
                            "message": saved_msg,
                        }
                        
                        # Publish to receiver's channel
                        await publish_message(receiver_id, msg_payload)
                        
                        # Also send confirmation back to sender
                        await websocket.send_json(msg_payload)
                        
            except WebSocketDisconnect:
                break
            except Exception as e:
                # Send error back to client
                await websocket.send_json({"type": "error", "message": str(e)})
                
    finally:
        if subscription_task:
            subscription_task.cancel()
            try:
                await subscription_task
            except asyncio.CancelledError:
                pass
        active_connections.pop(user_id, None)


@router.get("/history/{other_user_id}")
async def get_message_history(
    other_user_id: str,
    user_id: str = Query(..., description="Current user's ID"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> list[dict[str, Any]]:
    """
    Get paginated message history between two users.
    Returns messages in chronological order (oldest first).
    """
    # Verify both users exist
    if not get_profile_by_id(user_id):
        raise HTTPException(status_code=404, detail="User not found")
    if not get_profile_by_id(other_user_id):
        raise HTTPException(status_code=404, detail="Other user not found")
    
    messages = get_messages_between(user_id, other_user_id, limit=limit, offset=offset)
    return messages


@router.post("/send")
async def send_message(request: SendMessageRequest) -> dict[str, Any]:
    """
    Send a message via REST (alternative to WebSocket).
    Also publishes to Redis for real-time delivery.
    """
    # Verify both users exist
    if not get_profile_by_id(request.sender_id):
        raise HTTPException(status_code=404, detail="Sender not found")
    if not get_profile_by_id(request.receiver_id):
        raise HTTPException(status_code=404, detail="Receiver not found")
    
    # Persist message
    saved_msg = insert_message(
        sender_id=request.sender_id,
        receiver_id=request.receiver_id,
        content=request.content,
    )
    
    # Broadcast to receiver via Redis
    msg_payload = {
        "type": "new_message",
        "message": saved_msg,
    }
    await publish_message(request.receiver_id, msg_payload)
    
    return saved_msg

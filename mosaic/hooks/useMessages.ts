"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Message } from "@/types/api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface UseMessagesOptions {
    userId: string;
    recipientId: string;
}

interface UseMessagesReturn {
    messages: Message[];
    sendMessage: (content: string) => void;
    isConnected: boolean;
    isLoading: boolean;
    error: string | null;
}

export function useMessages({ userId, recipientId }: UseMessagesOptions): UseMessagesReturn {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Use refs to always have current values in WebSocket callbacks
    const recipientIdRef = useRef(recipientId);
    const userIdRef = useRef(userId);

    // Keep refs in sync with props
    useEffect(() => {
        recipientIdRef.current = recipientId;
    }, [recipientId]);

    useEffect(() => {
        userIdRef.current = userId;
    }, [userId]);

    // Load message history
    useEffect(() => {
        if (!userId || !recipientId) return;

        const loadHistory = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(
                    `${API_BASE}/messages/history/${recipientId}?user_id=${userId}&limit=50`
                );
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data);
                }
            } catch (err) {
                console.error("Failed to load message history:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadHistory();
    }, [userId, recipientId]);

    // WebSocket connection - only depends on userId, not recipientId
    // This prevents reconnection when switching conversations
    useEffect(() => {
        if (!userId) return;

        const connect = () => {
            const wsUrl = API_BASE.replace(/^http/, "ws");
            const ws = new WebSocket(`${wsUrl}/messages/ws/${userId}`);

            ws.onopen = () => {
                setIsConnected(true);
                setError(null);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === "new_message" && data.message) {
                        const msg = data.message as Message;

                        // Read current values from refs (not stale closure values)
                        const currentRecipientId = recipientIdRef.current;
                        const currentUserId = userIdRef.current;

                        const isPartOfConversation =
                            (msg.sender_id === currentUserId && msg.receiver_id === currentRecipientId) ||
                            (msg.sender_id === currentRecipientId && msg.receiver_id === currentUserId);

                        // Only add if it's part of this conversation
                        if (isPartOfConversation) {
                            setMessages((prev) => {
                                // Check if we already have this message (by real ID)
                                if (prev.some((m) => m.id === msg.id)) return prev;

                                // If this is our own message, replace the optimistic one
                                if (msg.sender_id === currentUserId) {
                                    // Find and replace optimistic message with same content
                                    const optimisticIdx = prev.findIndex(
                                        (m) => m.id.startsWith("temp-") && m.content === msg.content
                                    );
                                    if (optimisticIdx !== -1) {
                                        const updated = [...prev];
                                        updated[optimisticIdx] = msg;
                                        return updated;
                                    }
                                }

                                // Otherwise just add the new message
                                return [...prev, msg];
                            });
                        }
                    }
                } catch (err) {
                    console.error("Failed to parse WebSocket message:", err);
                }
            };

            ws.onclose = () => {
                setIsConnected(false);
                // Reconnect after 3 seconds
                reconnectTimeoutRef.current = setTimeout(connect, 3000);
            };

            ws.onerror = () => {
                setError("Connection error");
                ws.close();
            };

            wsRef.current = ws;
        };

        connect();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [userId]); // Only reconnect when userId changes, not recipientId

    const sendMessage = useCallback(
        (content: string) => {
            if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
                setError("Not connected");
                return;
            }

            // Optimistic update: add message immediately to show in UI
            const optimisticMessage: Message = {
                id: `temp-${Date.now()}`, // Temporary ID until server confirms
                sender_id: userId,
                receiver_id: recipientId,
                content,
                created_at: new Date().toISOString(),
            };
            setMessages((prev) => [...prev, optimisticMessage]);

            wsRef.current.send(
                JSON.stringify({
                    type: "send",
                    receiver_id: recipientId,
                    content,
                })
            );
        },
        [recipientId, userId]
    );

    return {
        messages,
        sendMessage,
        isConnected,
        isLoading,
        error,
    };
}

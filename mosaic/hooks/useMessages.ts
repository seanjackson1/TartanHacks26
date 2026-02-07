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

    // WebSocket connection
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
                        // Only add if it's part of this conversation
                        if (
                            (msg.sender_id === userId && msg.receiver_id === recipientId) ||
                            (msg.sender_id === recipientId && msg.receiver_id === userId)
                        ) {
                            setMessages((prev) => {
                                // Avoid duplicates
                                if (prev.some((m) => m.id === msg.id)) return prev;
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
    }, [userId, recipientId]);

    const sendMessage = useCallback(
        (content: string) => {
            if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
                setError("Not connected");
                return;
            }

            wsRef.current.send(
                JSON.stringify({
                    type: "send",
                    receiver_id: recipientId,
                    content,
                })
            );
        },
        [recipientId]
    );

    return {
        messages,
        sendMessage,
        isConnected,
        isLoading,
        error,
    };
}

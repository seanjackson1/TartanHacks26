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

        console.log("[DEBUG] loadHistory effect running", { userId, recipientId });

        const loadHistory = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(
                    `${API_BASE}/messages/history/${recipientId}?user_id=${userId}&limit=50`
                );
                if (res.ok) {
                    const data = await res.json();
                    console.log("[DEBUG] loadHistory overwriting messages with", data.length, "messages from DB");
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
                    console.log("[DEBUG] WS onmessage received:", data);
                    console.log("[DEBUG] Current recipientId in closure:", recipientId);

                    if (data.type === "new_message" && data.message) {
                        const msg = data.message as Message;

                        const isPartOfConversation =
                            (msg.sender_id === userId && msg.receiver_id === recipientId) ||
                            (msg.sender_id === recipientId && msg.receiver_id === userId);

                        console.log("[DEBUG] Filter check:", {
                            msgSenderId: msg.sender_id,
                            msgReceiverId: msg.receiver_id,
                            userId,
                            recipientId,
                            isPartOfConversation
                        });

                        // Only add if it's part of this conversation
                        if (isPartOfConversation) {
                            setMessages((prev) => {
                                console.log("[DEBUG] setMessages called, prev has", prev.length, "messages");
                                console.log("[DEBUG] prev message IDs:", prev.map(m => m.id));

                                // Check if we already have this message (by real ID)
                                if (prev.some((m) => m.id === msg.id)) {
                                    console.log("[DEBUG] Message already exists, skipping");
                                    return prev;
                                }

                                // If this is our own message, replace the optimistic one
                                if (msg.sender_id === userId) {
                                    // Find and replace optimistic message with same content
                                    const optimisticIdx = prev.findIndex(
                                        (m) => m.id.startsWith("temp-") && m.content === msg.content
                                    );
                                    console.log("[DEBUG] Looking for optimistic msg, found at idx:", optimisticIdx);
                                    if (optimisticIdx !== -1) {
                                        console.log("[DEBUG] Replacing optimistic message at index", optimisticIdx);
                                        const updated = [...prev];
                                        updated[optimisticIdx] = msg;
                                        return updated;
                                    }
                                }

                                // Otherwise just add the new message
                                console.log("[DEBUG] Adding new message to end");
                                return [...prev, msg];
                            });
                        } else {
                            console.log("[DEBUG] Message filtered out - not part of current conversation");
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

            // Optimistic update: add message immediately to show in UI
            const optimisticMessage: Message = {
                id: `temp-${Date.now()}`, // Temporary ID until server confirms
                sender_id: userId,
                receiver_id: recipientId,
                content,
                created_at: new Date().toISOString(),
            };
            console.log("[DEBUG] sendMessage: Adding optimistic message", optimisticMessage.id);
            setMessages((prev) => {
                console.log("[DEBUG] sendMessage: prev had", prev.length, "messages, adding optimistic");
                return [...prev, optimisticMessage];
            });

            wsRef.current.send(
                JSON.stringify({
                    type: "send",
                    receiver_id: recipientId,
                    content,
                })
            );
            console.log("[DEBUG] sendMessage: Sent to WebSocket");
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

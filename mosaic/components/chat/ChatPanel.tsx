"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useMessages } from "@/hooks/useMessages";
import { useAppStore } from "@/store/useAppStore";
import MessageBubble from "./MessageBubble";
import { Send, X, Loader2 } from "lucide-react";

export default function ChatPanel() {
    const { currentUser, chatRecipientId, setChatRecipientId, selectedMatch } = useAppStore();
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { messages, sendMessage, isConnected, isLoading } = useMessages({
        userId: currentUser?.id || "",
        recipientId: chatRecipientId || "",
    });

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        const content = inputValue.trim();
        if (!content) return;
        sendMessage(content);
        setInputValue("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!chatRecipientId || !currentUser) return null;

    const recipientName = selectedMatch?.user.username || "User";

    return (
        <motion.div
            initial={{ x: -320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -320, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-4 right-[340px] bottom-4 w-80 z-50 glass flex flex-col overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-glass-border">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold text-xs">
                            {recipientName.slice(0, 2).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm text-foreground">{recipientName}</h3>
                        <span className={`text-[10px] ${isConnected ? "text-green-neon" : "text-foreground/40"}`}>
                            {isConnected ? "Connected" : "Connecting..."}
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => setChatRecipientId(null)}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white/5 text-foreground/60 hover:text-foreground hover:bg-white/10 transition-colors"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="w-6 h-6 text-cyan animate-spin" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-foreground/40 text-sm">
                        No messages yet. Say hello!
                    </div>
                ) : (
                    messages.map((msg) => (
                        <MessageBubble
                            key={msg.id}
                            message={msg}
                            isOwn={msg.sender_id === currentUser.id}
                        />
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-glass-border">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="flex-1 bg-white/5 border border-glass-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-cyan/50 transition-colors"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!inputValue.trim()}
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

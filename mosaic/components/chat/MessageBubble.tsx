"use client";

import type { Message } from "@/types/api";

interface MessageBubbleProps {
    message: Message;
    isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    return (
        <div
            className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3`}
        >
            <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${isOwn
                        ? "bg-gradient-to-br from-cyan-500/30 to-cyan-600/20 border border-cyan/30 text-foreground"
                        : "bg-gradient-to-br from-magenta/20 to-purple-600/20 border border-magenta/30 text-foreground"
                    }`}
            >
                <p className="text-sm leading-relaxed break-words">{message.content}</p>
                <p
                    className={`text-[10px] mt-1 ${isOwn ? "text-cyan/60" : "text-magenta/60"
                        }`}
                >
                    {formatTime(message.created_at)}
                </p>
            </div>
        </div>
    );
}

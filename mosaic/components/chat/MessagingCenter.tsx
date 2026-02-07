"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useAppStore } from "@/store/useAppStore";
import { api } from "@/lib/api";
import type { Conversation } from "@/types/api";
import { X, MessageCircle, Loader2 } from "lucide-react";

export default function MessagingCenter() {
  const {
    currentUser,
    isMessagingCenterOpen,
    setIsMessagingCenterOpen,
    setChatRecipientId,
    setSelectedMatch,
    matches,
  } = useAppStore();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch conversations when panel opens
  useEffect(() => {
    if (!isMessagingCenterOpen || !currentUser) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const data = await api.getConversations(currentUser.id);
        if (data) setConversations(data);
      } catch (err) {
        console.error("Failed to load conversations:", err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [isMessagingCenterOpen, currentUser]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        // Don't close if clicking the messaging button itself
        const target = e.target as HTMLElement;
        if (target.closest("[data-messaging-trigger]")) return;
        setIsMessagingCenterOpen(false);
      }
    };
    if (isMessagingCenterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMessagingCenterOpen, setIsMessagingCenterOpen]);

  const handleConversationClick = async (conv: Conversation) => {
    // Find matching user in matches to populate ChatPanel header
    const match = matches.find((m) => m.user.id === conv.user_id);
    if (match) {
      setSelectedMatch(match);
    } else {
      // Create a minimal match-like object so ChatPanel can display the name
      setSelectedMatch({
        user: {
          id: conv.user_id,
          username: conv.username,
          avatar_url: conv.avatar_url,
          latitude: 0,
          longitude: 0,
        },
        similarity_score: 0,
      });
    }

    setChatRecipientId(conv.user_id);
    setIsMessagingCenterOpen(false);

    // Mark messages as read
    if (conv.unread_count > 0) {
      try {
        await api.markAsRead(conv.user_id, currentUser!.id);
      } catch (err) {
        console.error("Failed to mark messages as read:", err);
      }
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getInitials = (name: string) => name.slice(0, 2).toUpperCase();

  if (!currentUser) return null;

  return (
    <AnimatePresence>
      {isMessagingCenterOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed top-[7.5rem] left-4 w-80 max-h-[70vh] z-[999] bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-cyan-500/10 to-purple-600/10">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-cyan-400" />
              <h3 className="text-white font-semibold text-sm">Messages</h3>
            </div>
            <button
              onClick={() => setIsMessagingCenterOpen(false)}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <MessageCircle className="w-10 h-10 text-white/20 mb-3" />
                <p className="text-white/40 text-sm">No conversations yet</p>
                <p className="text-white/25 text-xs mt-1">
                  Start chatting with your matches!
                </p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.user_id}
                  onClick={() => handleConversationClick(conv)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
                      {conv.avatar_url ? (
                        <Image
                          src={conv.avatar_url}
                          alt={conv.username}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500 to-purple-600">
                          <span className="text-white font-bold text-xs">
                            {getInitials(conv.username)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm font-medium truncate ${conv.unread_count > 0 ? "text-white" : "text-white/80"}`}>
                        {conv.username}
                      </span>
                      <span className="text-[10px] text-white/40 flex-shrink-0 ml-2">
                        {formatRelativeTime(conv.last_message_at)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className={`text-xs truncate ${conv.unread_count > 0 ? "text-white/70 font-medium" : "text-white/40"}`}>
                        {conv.last_message}
                      </p>
                      {conv.unread_count > 0 && (
                        <span className="flex-shrink-0 ml-2 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                          {conv.unread_count > 99 ? "99+" : conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useAppStore } from "@/store/useAppStore";
import { MessageCircle } from "lucide-react";

export default function ProfileCard() {
  const { selectedMatch, setSelectedMatch, isOnboarding, setChatRecipientId } = useAppStore();

  if (isOnboarding) return null;

  // Generate initials from username
  const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <AnimatePresence>
      {selectedMatch && (
        <motion.div
          key="profile-card"
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-50 glass p-6 flex flex-col gap-4 overflow-y-auto md:top-4 md:right-4 md:bottom-4 md:w-80 md:rounded-xl text-left"
        >
          {/* Close button */}
          <button
            onClick={() => setSelectedMatch(null)}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-foreground/60 hover:text-foreground hover:bg-white/10 transition-colors z-10"
          >
            &times;
          </button>

          {/* Profile Picture & Username Header */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-cyan/50 shadow-lg shadow-cyan/20 flex-shrink-0">
              {(selectedMatch.user.metadata?.avatar_url || selectedMatch.user.avatar_url) ? (
                <Image
                  src={(selectedMatch.user.metadata?.avatar_url || selectedMatch.user.avatar_url) as string}
                  alt={selectedMatch.user.username}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                  unoptimized={false}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500 to-purple-600">
                  <span className="text-white font-bold text-lg">
                    {getInitials(selectedMatch.user.username)}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-cyan">
                {selectedMatch.user.username}
              </h2>
              {selectedMatch.distance_km != null && (
                <p className="text-xs text-foreground/50">
                  {selectedMatch.distance_km.toFixed(1)} km away
                </p>
              )}
            </div>
          </div>

          {/* Bio */}
          {selectedMatch.user.bio && (
            <p className="text-sm text-foreground/70">
              {selectedMatch.user.bio}
            </p>
          )}

          {/* Match Score */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <span className="text-xs uppercase tracking-wider text-foreground/50">
                Match
              </span>
              <div className="text-2xl font-mono text-green-neon">
                {Math.round(selectedMatch.similarity_score * 100)}%
              </div>
            </div>

            {/* Message Button */}
            <button
              onClick={() => setChatRecipientId(selectedMatch.user.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 border border-cyan/30 text-cyan hover:from-cyan-500/30 hover:to-cyan-600/30 transition-all"
            >
              <MessageCircle size={16} />
              <span className="text-sm font-medium">Message</span>
            </button>
          </div>

          {/* Interests */}
          {(Array.isArray(selectedMatch.user.metadata?.all_interests) || Array.isArray(selectedMatch.user.metadata?.top_interests)) && (
            <div>
              <span className="text-xs uppercase tracking-wider text-foreground/50">
                Interests
              </span>
              <div className="flex flex-wrap gap-2 mt-2">
                {(
                  (selectedMatch.user.metadata?.top_interests) as string[]
                ).map((interest: string, i: number) => (
                  <span
                    key={i}
                    className="px-2 py-1 text-xs rounded-full bg-cyan/10 text-cyan border border-cyan/20"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Instagram Embed Section */}
          {selectedMatch.user.instagram_handle && (
            <div className="mt-2">
              <span className="text-xs uppercase tracking-wider text-foreground/50">
                Instagram
              </span>
              <div className="mt-2 rounded-xl overflow-hidden border border-white/10 bg-black/30">
                {/* Instagram Profile Embed */}
                <iframe
                  src={`https://www.instagram.com/${selectedMatch.user.instagram_handle.replace(/^@/, '')}/embed`}
                  className="w-full h-[400px] border-0"
                  scrolling="no"
                  // @ts-expect-error - allowtransparency is a valid HTML attribute but not typed in React
                  allowtransparency="true"
                  loading="lazy"
                />
              </div>
            </div>
          )}

          {/* */}

          {/* Instagram Link Button */}
          {selectedMatch.user.instagram_handle && (
            <a
              href={`https://instagram.com/${selectedMatch.user.instagram_handle.replace(/^@/, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white font-semibold hover:opacity-90 transition-opacity text-center flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
              View @{selectedMatch.user.instagram_handle.replace(/^@/, '')}
            </a>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}


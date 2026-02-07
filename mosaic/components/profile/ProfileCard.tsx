"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";

export default function ProfileCard() {
  const { selectedMatch, setSelectedMatch, isOnboarding } = useAppStore();

  if (isOnboarding) return null;

  return (
    <AnimatePresence>
      {selectedMatch && (
        <motion.div
          key="profile-card"
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed top-4 right-4 bottom-4 w-80 z-50 glass p-6 flex flex-col gap-4 overflow-y-auto"
        >
          {/* Close button */}
          <button
            onClick={() => setSelectedMatch(null)}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-foreground/60 hover:text-foreground hover:bg-white/10 transition-colors"
          >
            &times;
          </button>

          {/* Username */}
          <h2 className="text-2xl font-bold text-cyan">
            {selectedMatch.user.username}
          </h2>

          {/* Bio */}
          {selectedMatch.user.bio && (
            <p className="text-sm text-foreground/70">
              {selectedMatch.user.bio}
            </p>
          )}

          {/* Similarity Score */}
          <div>
            <span className="text-xs uppercase tracking-wider text-foreground/50">
              Match
            </span>
            <div className="text-3xl font-mono text-green-neon">
              {Math.round(selectedMatch.similarity_score * 100)}%
            </div>
          </div>

          {/* Composite Score */}
          {selectedMatch.composite_score != null && (
            <div>
              <span className="text-xs uppercase tracking-wider text-foreground/50">
                Composite Score
              </span>
              <div className="text-lg font-mono text-cyan">
                {selectedMatch.composite_score.toFixed(2)}
              </div>
            </div>
          )}

          {/* Ideology Distance */}
          {selectedMatch.ideological_distance != null && (
            <div>
              <span className="text-xs uppercase tracking-wider text-foreground/50">
                Ideology Distance
              </span>
              <div className="h-2 bg-foreground/10 rounded-full mt-1">
                <div
                  className="h-full bg-magenta rounded-full transition-all"
                  style={{
                    width: `${(selectedMatch.ideological_distance / 9) * 100}%`,
                  }}
                />
              </div>
              <span className="text-xs text-foreground/40 mt-0.5">
                {selectedMatch.ideological_distance} points apart
              </span>
            </div>
          )}

          {/* Shared Interests from metadata */}
          {Array.isArray(selectedMatch.user.metadata?.top_interests) && (
            <div>
              <span className="text-xs uppercase tracking-wider text-foreground/50">
                Interests
              </span>
              <div className="flex flex-wrap gap-2 mt-2">
                {(
                  selectedMatch.user.metadata!.top_interests as string[]
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

          {/* Distance */}
          {selectedMatch.distance_km != null && (
            <p className="text-sm text-foreground/50">
              {selectedMatch.distance_km.toFixed(1)} km away
            </p>
          )}

          {/* Instagram Link */}
          {selectedMatch.user.instagram_handle && (
            <a
              href={`https://instagram.com/${selectedMatch.user.instagram_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto w-full py-3 rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white font-semibold hover:opacity-90 transition-opacity text-center flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              @{selectedMatch.user.instagram_handle}
            </a>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

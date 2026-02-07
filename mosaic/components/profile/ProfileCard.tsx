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

          {/* Discord CTA */}
          {selectedMatch.user.discord_handle && (
            <button className="mt-auto w-full py-3 rounded-lg bg-[#5865F2] text-white font-semibold hover:bg-[#4752C4] transition-colors">
              Connect: {selectedMatch.user.discord_handle}
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

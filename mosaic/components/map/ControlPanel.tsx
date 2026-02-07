"use client";

import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { api } from "@/lib/api";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ControlPanel() {
  const {
    currentUser,
    matches,
    setMatches,
    addMarkers,
    setLoading,
    isOnboarding,
    selectedIndex,
    setSelectedIndex,
    setSelectedMatch,
  } = useAppStore();

  if (isOnboarding || !currentUser) return null;

  const handleSearch = async () => {
    setLoading(true, "Scanning Humanity...");
    try {
      const res = await api.search({
        user_id: currentUser.id,
        mode: "harmony",
        limit: 50,
      });
      console.log("Search response:", res);
      console.log("Matches:", res.matches);
      console.log("Matches length:", res.matches?.length);
      setMatches(res.matches);
      addMarkers(res.matches.map((m) => m.user));
      // Clear any previous selection
      setSelectedMatch(null);
      setSelectedIndex(-1);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExplore = () => {
    if (matches.length > 0) {
      setSelectedIndex(0);
      setSelectedMatch(matches[0]);
    }
  };

  const navigateToPrev = () => {
    if (matches.length === 0) return;
    const newIndex = selectedIndex > 0 ? selectedIndex - 1 : matches.length - 1;
    setSelectedIndex(newIndex);
    setSelectedMatch(matches[newIndex]);
  };

  const navigateToNext = () => {
    if (matches.length === 0) return;
    const newIndex = selectedIndex < matches.length - 1 ? selectedIndex + 1 : 0;
    setSelectedIndex(newIndex);
    setSelectedMatch(matches[newIndex]);
  };

  // Check if a match is currently selected
  const hasSelection = selectedIndex !== -1;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, type: "spring", damping: 25 }}
      className="fixed bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-40 glass px-4 py-3 md:px-6 md:py-4 flex items-center gap-2 md:gap-4"
    >
      {/* Search Button - always visible */}
      <button
        onClick={handleSearch}
        className="px-6 py-2 rounded-lg font-semibold text-sm transition-all hover:opacity-90"
        style={{
          background: "var(--cyan)",
          color: "var(--background)",
        }}
      >
        Find My People
      </button>

      {/* Explore Button - shown when matches exist but none selected */}
      {matches.length > 0 && !hasSelection && (
        <button
          onClick={handleExplore}
          className="px-6 py-2 rounded-lg font-semibold text-sm transition-all hover:opacity-90 bg-white/10 border border-white/20 text-white hover:bg-white/20"
        >
          Explore Connections
        </button>
      )}

      {/* Navigation Controls - shown only when a match is selected */}
      {matches.length > 0 && hasSelection && (
        <div className="flex items-center gap-2">
          <button
            onClick={navigateToPrev}
            className="p-2 rounded-lg bg-white/5 border border-glass-border hover:bg-white/10 hover:border-cyan/30 transition-all"
            aria-label="Previous result"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="text-sm font-mono text-foreground/70 min-w-[60px] text-center">
            {selectedIndex + 1} / {matches.length}
          </span>
          
          <button
            onClick={navigateToNext}
            className="p-2 rounded-lg bg-white/5 border border-glass-border hover:bg-white/10 hover:border-cyan/30 transition-all"
            aria-label="Next result"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </motion.div>
  );
}

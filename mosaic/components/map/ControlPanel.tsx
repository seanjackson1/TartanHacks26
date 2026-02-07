"use client";

import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { api } from "@/lib/api";
import type { Mode } from "@/types/api";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function ControlPanel() {
  const {
    currentUser,
    mode,
    setMode,
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
        mode,
        limit: 10,
      });
      console.log("Search response:", res);
      console.log("Matches:", res.matches);
      console.log("Matches length:", res.matches?.length);
      setMatches(res.matches);
      addMarkers(res.matches.map((m) => m.user));
      // Auto-select first result
      if (res.matches.length > 0) {
        setSelectedIndex(0);
        setSelectedMatch(res.matches[0]);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
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

  const modes: { value: Mode; label: string; color: string }[] = [
    { value: "harmony", label: "Harmony", color: "var(--cyan)" },
    { value: "contrast", label: "Contrast", color: "var(--magenta)" },
  ];

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, type: "spring", damping: 25 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 glass px-6 py-4 flex items-center gap-4"
    >
      {/* Mode Toggle */}
      <div className="flex rounded-lg overflow-hidden border border-glass-border">
        {modes.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className="px-4 py-2 text-sm font-medium transition-all"
            style={{
              background: mode === m.value ? m.color : "transparent",
              color: mode === m.value ? "var(--background)" : "var(--foreground)",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        className="px-6 py-2 rounded-lg font-semibold text-sm transition-all"
        style={{
          background: mode === "harmony" ? "var(--cyan)" : "var(--magenta)",
          color: "var(--background)",
        }}
      >
        Find Connections
      </button>

      {/* Navigation Controls - shown when there are results */}
      {matches.length > 0 && (
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


"use client";

import { motion } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { api } from "@/lib/api";
import type { Mode } from "@/types/api";

export default function ControlPanel() {
  const {
    currentUser,
    mode,
    setMode,
    setMatches,
    addMarkers,
    setLoading,
    isOnboarding,
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
      setMatches(res.matches);
      addMarkers(res.matches.map((m) => m.user));
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
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
    </motion.div>
  );
}

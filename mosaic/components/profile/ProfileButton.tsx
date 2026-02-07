"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { MapPin, User, Instagram, X, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ProfileButton() {
  const [isOpen, setIsOpen] = useState(false);
  const currentUser = useAppStore((s) => s.currentUser);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const setIsOnboarding = useAppStore((s) => s.setIsOnboarding);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setIsOnboarding(true);
    setIsOpen(false);
  };

  if (!currentUser) return null;

  return (
    <div ref={menuRef} className="fixed top-4 left-4 z-[1000]">
      {/* Profile Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/20 bg-gray-900 transition-all hover:border-cyan-400"
      >
        {currentUser.avatar_url ? (
          <img
            src={currentUser.avatar_url}
            alt={currentUser.username}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500 to-purple-600">
            <User className="w-6 h-6 text-white" />
          </div>
        )}
        {/* Online indicator */}
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full" />
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute top-16 left-0 w-72 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
          >
            {/* Header with avatar */}
            <div className="relative p-4 bg-gradient-to-br from-cyan-500/20 to-purple-600/20 border-b border-white/10">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/20">
                  {currentUser.avatar_url ? (
                    <img
                      src={currentUser.avatar_url}
                      alt={currentUser.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-cyan-500 to-purple-600">
                      <User className="w-7 h-7 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">
                    {currentUser.username}
                  </h3>
                  <span className="text-xs text-cyan-400 font-mono">CONNECTED</span>
                </div>
              </div>
            </div>

            {/* Info Items */}
            <div className="p-3 space-y-1">
              {/* Location */}
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <div className="text-xs text-white/50 uppercase tracking-wider">Location</div>
                  <div className="text-white text-sm font-mono">
                    {currentUser.latitude.toFixed(4)}, {currentUser.longitude.toFixed(4)}
                  </div>
                </div>
              </div>

              {/* Instagram */}
              {currentUser.instagram_handle && (
                <a
                  href={`https://instagram.com/${currentUser.instagram_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <Instagram className="w-4 h-4 text-pink-400" />
                  </div>
                  <div>
                    <div className="text-xs text-white/50 uppercase tracking-wider">Instagram</div>
                    <div className="text-white text-sm group-hover:text-pink-400 transition-colors">
                      @{currentUser.instagram_handle}
                    </div>
                  </div>
                </a>
              )}
            </div>

            {/* Logout */}
            <div className="p-3 pt-0">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

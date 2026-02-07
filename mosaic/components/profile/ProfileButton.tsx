"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { MapPin, User, Instagram, X, LogOut, Pencil, Save, Loader2, Check, Youtube, Gamepad2, Github, Music, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { api, ConnectionsResponse } from "@/lib/api";
import { API_BASE_URL } from "@/lib/constants";

export default function ProfileButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const currentUser = useAppStore((s) => s.currentUser);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const setIsOnboarding = useAppStore((s) => s.setIsOnboarding);
  const menuRef = useRef<HTMLDivElement>(null);

  // Connections state
  const [connections, setConnections] = useState<ConnectionsResponse | null>(null);
  const [connectingProvider, setConnectingProvider] = useState<string | null>(null);

  // Edit interests state
  const [isEditingInterests, setIsEditingInterests] = useState(false);
  const [interestsRaw, setInterestsRaw] = useState("");
  const [isSavingInterests, setIsSavingInterests] = useState(false);

  // Edit form state
  const [editUsername, setEditUsername] = useState("");
  const [editLatitude, setEditLatitude] = useState("");
  const [editLongitude, setEditLongitude] = useState("");
  const [editInstagram, setEditInstagram] = useState("");

  // Initialize edit form when user changes or edit mode is entered
  useEffect(() => {
    if (currentUser && isEditing) {
      setEditUsername(currentUser.username || "");
      setEditLatitude(currentUser.latitude?.toString() || "");
      setEditLongitude(currentUser.longitude?.toString() || "");
      setEditInstagram(currentUser.instagram_handle || "");
    }
  }, [currentUser, isEditing]);

  // Fetch connections when dropdown opens
  useEffect(() => {
    if (isOpen && !connections) {
      api.getConnections().then(setConnections);
    }
  }, [isOpen, connections]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsEditing(false);
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
    window.location.reload();
  };

  const handleSave = async () => {
    if (!currentUser) return;

    setIsSaving(true);
    try {
      const lat = parseFloat(editLatitude);
      const lng = parseFloat(editLongitude);

      const updated = await api.updateProfile({
        username: editUsername || undefined,
        latitude: !isNaN(lat) ? lat : undefined,
        longitude: !isNaN(lng) ? lng : undefined,
        instagram_handle: editInstagram || undefined,
      });

      if (updated) {
        setCurrentUser({
          ...currentUser,
          username: updated.username || currentUser.username,
          latitude: updated.latitude ?? currentUser.latitude,
          longitude: updated.longitude ?? currentUser.longitude,
          instagram_handle: updated.instagram_handle ?? currentUser.instagram_handle,
        });
      }
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleEditInterests = async () => {
    // Load current interests from profile
    const profile = await api.getProfile();
    const allInterests = (profile?.metadata as { all_interests?: string[] } | undefined)?.all_interests || [];
    setInterestsRaw(allInterests.join(", "));
    setIsEditingInterests(true);
  };

  const handleSaveInterests = async () => {
    setIsSavingInterests(true);
    try {
      const interests = interestsRaw.split(",").map(s => s.trim()).filter(Boolean);
      const result = await api.updateInterests(interests);
      if (result.success) {
        console.log(`Interests updated with ${result.interests_count} total interests`);
      }
      setIsEditingInterests(false);
    } catch (err) {
      console.error("Failed to update interests:", err);
    } finally {
      setIsSavingInterests(false);
    }
  };

  const handleConnect = async (provider: string) => {
    setConnectingProvider(provider);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      setConnectingProvider(null);
      return;
    }

    const width = 600;
    const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const authWindow = window.open(
      `${API_BASE_URL}/auth/${provider}/start?user_id=${session.user.id}`,
      `${provider}_oauth`,
      `width=${width},height=${height},left=${left},top=${top}`
    );

    const pollTimer = setInterval(() => {
      if (authWindow?.closed) {
        clearInterval(pollTimer);
        setConnectingProvider(null);
        // Refresh connections and regenerate dna_string with new platform data
        api.getConnections().then(setConnections);
        api.refreshProfile().then((res) => {
          if (res?.success) {
            console.log(`Profile refreshed with ${res.interests_count} interests`);
          }
        }).catch(console.error);
      }
    }, 500);

    setTimeout(() => {
      clearInterval(pollTimer);
      authWindow?.close();
      setConnectingProvider(null);
    }, 5 * 60 * 1000);
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "youtube": return <Youtube className="w-4 h-4" />;
      case "steam": return <Gamepad2 className="w-4 h-4" />;
      case "github": return <Github className="w-4 h-4" />;
      case "spotify": return <Music className="w-4 h-4" />;
      default: return null;
    }
  };

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case "youtube": return "text-red-400 bg-red-500/20";
      case "steam": return "text-blue-400 bg-blue-500/20";
      case "github": return "text-gray-400 bg-gray-500/20";
      case "spotify": return "text-green-400 bg-green-500/20";
      default: return "text-gray-400 bg-gray-500/20";
    }
  };

  if (!currentUser) return null;

  return (
    <div ref={menuRef} className="fixed top-4 left-4 z-[1000]">
      {/* Profile Button */}
      <div className="relative">
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
        </motion.button>
        {/* Online indicator - outside button to avoid clipping */}
        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full pointer-events-none" />
      </div>

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
                onClick={() => {
                  setIsOpen(false);
                  setIsEditing(false);
                }}
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
                <div className="flex-1">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="w-full bg-black/30 border border-white/20 rounded-lg px-2 py-1 text-white font-semibold text-lg focus:outline-none focus:border-cyan-500"
                      placeholder="Username"
                    />
                  ) : (
                    <>
                      <h3 className="text-white font-semibold text-lg">
                        {currentUser.username}
                      </h3>
                      <span className="text-xs text-cyan-400 font-mono">CONNECTED</span>
                    </>
                  )}
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
                <div className="flex-1">
                  <div className="text-xs text-white/50 uppercase tracking-wider">Location</div>
                  {isEditing ? (
                    <div className="flex gap-2 mt-1">
                      <input
                        type="text"
                        value={editLatitude}
                        onChange={(e) => setEditLatitude(e.target.value)}
                        className="w-1/2 bg-black/30 border border-white/20 rounded-lg px-2 py-1 text-white text-sm font-mono focus:outline-none focus:border-cyan-500"
                        placeholder="Lat"
                      />
                      <input
                        type="text"
                        value={editLongitude}
                        onChange={(e) => setEditLongitude(e.target.value)}
                        className="w-1/2 bg-black/30 border border-white/20 rounded-lg px-2 py-1 text-white text-sm font-mono focus:outline-none focus:border-cyan-500"
                        placeholder="Lng"
                      />
                    </div>
                  ) : (
                    <div className="text-white text-sm font-mono">
                      {currentUser.latitude.toFixed(4)}, {currentUser.longitude.toFixed(4)}
                    </div>
                  )}
                </div>
              </div>

              {/* Instagram */}
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                  <Instagram className="w-4 h-4 text-pink-400" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-white/50 uppercase tracking-wider">Instagram</div>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editInstagram}
                      onChange={(e) => setEditInstagram(e.target.value)}
                      className="w-full bg-black/30 border border-white/20 rounded-lg px-2 py-1 text-white text-sm mt-1 focus:outline-none focus:border-cyan-500"
                      placeholder="@username"
                    />
                  ) : currentUser.instagram_handle ? (
                    <a
                      href={`https://instagram.com/${currentUser.instagram_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white text-sm hover:text-pink-400 transition-colors"
                    >
                      @{currentUser.instagram_handle}
                    </a>
                  ) : (
                    <span className="text-white/40 text-sm">Not set</span>
                  )}
                </div>
              </div>

              {/* Connected Apps */}
              {!isEditing && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="text-xs text-white/50 uppercase tracking-wider px-3 mb-2">Connected Apps</div>
                  <div className="space-y-1">
                    {["youtube", "steam", "github", "spotify"].map((provider) => {
                      const isConnected = connections?.connected.includes(provider);
                      const isConnecting = connectingProvider === provider;
                      return (
                        <div
                          key={provider}
                          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getProviderColor(provider)}`}>
                            {getProviderIcon(provider)}
                          </div>
                          <span className="flex-1 text-white text-sm capitalize">{provider}</span>
                          {isConnected ? (
                            <span className="flex items-center gap-1 text-green-400 text-xs">
                              <Check className="w-3 h-3" /> Connected
                            </span>
                          ) : (
                            <button
                              onClick={() => handleConnect(provider)}
                              disabled={isConnecting}
                              className="text-xs text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
                            >
                              {isConnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Connect"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-3 pt-0 space-y-2">
              {isEditing ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 transition-colors"
                  >
                    <span className="text-sm font-medium">Cancel</span>
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 transition-colors"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">Save</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                  <span className="text-sm font-medium">Edit Profile</span>
                </button>
              )}

              {/* Edit Interests */}
              {isEditingInterests ? (
                <div className="space-y-2">
                  <div className="text-xs text-white/50 uppercase tracking-wider">Edit Interests (comma-separated)</div>
                  <textarea
                    value={interestsRaw}
                    onChange={(e) => setInterestsRaw(e.target.value)}
                    placeholder="hiking, gaming, AI/ML, music..."
                    rows={3}
                    className="w-full bg-black/30 border border-white/20 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-cyan-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditingInterests(false)}
                      disabled={isSavingInterests}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 transition-colors"
                    >
                      <span className="text-sm">Cancel</span>
                    </button>
                    <button
                      onClick={handleSaveInterests}
                      disabled={isSavingInterests}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 transition-colors"
                    >
                      {isSavingInterests ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span className="text-sm">Save</span>
                    </button>
                  </div>
                </div>
              ) : !isEditing && (
                <button
                  onClick={handleEditInterests}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm font-medium">Edit Interests</span>
                </button>
              )}

              {/* Logout */}
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

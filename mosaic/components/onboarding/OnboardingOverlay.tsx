"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAppStore } from "@/store/useAppStore";
import { api } from "@/lib/api";
import InterestInput from "./InterestInput";

export default function OnboardingOverlay() {
  const { isOnboarding, setIsOnboarding, setCurrentUser, setLoading } =
    useAppStore();
  const geo = useGeolocation();

  if (!isOnboarding) return null;

  const handleSubmit = async (data: {
    username: string;
    interests: string[];
    bio: string;
    ideology_score: number;
    instagram_handle: string;
    youtube_username: string;
    steam_id: string;
    github_username: string;
  }) => {
    setLoading(true, "Building your profile...");
    try {
      const res = await api.ingest({
        username: data.username,
        interests: data.interests,
        latitude: geo.latitude!,
        longitude: geo.longitude!,
        bio: data.bio,
        ideology_score: data.ideology_score,
        instagram_handle: data.instagram_handle,
        youtube_username: data.youtube_username,
        steam_id: data.steam_id,
        github_username: data.github_username,
      });
      setCurrentUser({
        id: res.user_id,
        username: data.username,
        latitude: geo.latitude!,
        longitude: geo.longitude!,
        marker_color: res.marker_color,
        bio: data.bio,
        ideology_score: data.ideology_score,
        instagram_handle: data.instagram_handle,
      });
      setIsOnboarding(false);
    } catch (err) {
      console.error("Ingest failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOnboarding && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", damping: 25 }}
          >
            <InterestInput
              onSubmit={handleSubmit}
              latitude={geo.latitude}
              longitude={geo.longitude}
              onRequestLocation={geo.requestLocation}
              locationLoading={geo.loading}
              locationError={geo.error}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

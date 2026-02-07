"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAppStore } from "@/store/useAppStore";
import { api } from "@/lib/api";
import InterestInput from "./InterestInput";
import AuthStep from "@/components/auth/AuthStep";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

type OnboardingStep = "auth" | "profile";

export default function OnboardingOverlay() {
  const { isOnboarding, setIsOnboarding, setCurrentUser, setLoading } =
    useAppStore();
  const geo = useGeolocation();
  const [step, setStep] = useState<OnboardingStep>("auth");
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check session on mount
  useEffect(() => {
    let mounted = true;
    const checkSession = async () => {
      try {
        console.log("Checking session...");
        
        // Timeout check to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Auth check timed out")), 5000)
        );
        
        const sessionPromise = supabase.auth.getSession();
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (mounted && session) {
          console.log("Session found immediately");
          setStep("profile");
        }
      } catch (err) {
        console.warn("Auth check failed or timed out:", err);
      } finally {
        if (mounted) setCheckingAuth(false);
      }
    };
    checkSession();

    return () => { mounted = false; };
  }, []);

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
           className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-xl"
        >
          {checkingAuth ? (
             <div className="flex flex-col items-center gap-4">
               <div className="w-8 h-8 border-t-2 border-cyan-500 rounded-full animate-spin"></div>
               <div className="text-white/70 font-mono tracking-wider">INITIALIZING SYSTEM...</div>
             </div>
          ) : (
            <motion.div
              key={step}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", damping: 25 }}
              className="w-full max-w-2xl"
            >
              {step === "auth" ? (
                <AuthStep />
              ) : (
                <InterestInput
                  onSubmit={handleSubmit}
                  latitude={geo.latitude}
                  longitude={geo.longitude}
                  onRequestLocation={geo.requestLocation}
                  locationLoading={geo.loading}
                  locationError={geo.error}
                />
              )}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

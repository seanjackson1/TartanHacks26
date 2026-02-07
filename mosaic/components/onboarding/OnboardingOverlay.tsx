"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useAppStore } from "@/store/useAppStore";
import { api } from "@/lib/api";
import InterestInput from "./InterestInput";
import AuthStep from "@/components/auth/AuthStep";
import { supabase } from "@/lib/supabase";
import { useEffect, useState, useCallback } from "react";
import WorldMapBackground from "./WorldMapBackground";

type OnboardingStep = "auth" | "profile";

export default function OnboardingOverlay() {
  const { isOnboarding, setIsOnboarding, setCurrentUser, setLoading } =
    useAppStore();
  const geo = useGeolocation();
  const [step, setStep] = useState<OnboardingStep>("auth");
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const triggerExit = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      setIsOnboarding(false);
    }, 900);
  }, [setIsOnboarding]);

  // DEBUG LOGS
  useEffect(() => {
    console.log("[OnboardingOverlay] Mounted");
    console.log("[OnboardingOverlay] State:", { isOnboarding, step, checkingAuth });
    return () => console.log("[OnboardingOverlay] Unmounted");
  }, []);

  useEffect(() => {
    console.log("[OnboardingOverlay] State Update:", { isOnboarding, step, checkingAuth });
  }, [isOnboarding, step, checkingAuth]);

  // Check session on mount and fetch existing profile
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
          console.log("Session found, checking for existing profile...");

          // Check if user already has a profile in the backend
          try {
            const existingProfile = await api.getProfile();
            console.log("Existing profile:", existingProfile);

            if (existingProfile && existingProfile.username) {
              // User has complete profile, skip onboarding
              console.log("Profile exists, skipping onboarding");
              const avatarUrl = session.user?.user_metadata?.avatar_url ||
                session.user?.user_metadata?.picture;
              setCurrentUser({
                ...existingProfile,
                avatar_url: avatarUrl,
              });
              triggerExit();
              return;
            }
          } catch (err) {
            console.log("No existing profile found, showing onboarding");
          }

          // No profile yet, show profile creation step
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
  }, [setCurrentUser, triggerExit]);

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
      // Get avatar from Google OAuth session
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Session user metadata:", session?.user?.user_metadata);
      console.log("Full session user:", session?.user);

      // Try multiple possible locations for Google avatar
      const user = session?.user;
      const avatarUrl =
        user?.user_metadata?.avatar_url ||
        user?.user_metadata?.picture ||
        (user?.identities?.[0]?.identity_data as any)?.avatar_url ||
        (user?.identities?.[0]?.identity_data as any)?.picture;

      console.log("Resolved avatar URL:", avatarUrl);

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
        avatar_url: avatarUrl,
      });
      triggerExit();
    } catch (err) {
      console.error("Ingest failed:", err);
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      {/* Ripple rings — rendered outside clip container so they expand freely */}
      <AnimatePresence>
        {isExiting &&
          [0, 1, 2].map((i) => (
            <motion.div
              key={`ripple-${i}`}
              className="fixed inset-0 z-[10000] pointer-events-none flex items-center justify-center"
              initial={{ scale: 0, opacity: 0.7 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 0.9, delay: i * 0.12, ease: "easeOut" }}
            >
              <div
                className="w-[50vmax] h-[50vmax] rounded-full"
                style={{
                  border: "1px solid rgba(0, 242, 255, 0.3)",
                  boxShadow:
                    "0 0 30px rgba(0,242,255,0.25), 0 0 60px rgba(139,92,246,0.15)",
                }}
              />
            </motion.div>
          ))}
      </AnimatePresence>

      {/* Global styles for aurora background */}
      <style jsx global>{`
        .mosaic-bg {
          position: fixed;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          isolation: isolate;
          background: linear-gradient(
            315deg,
            #0A0E17 0%,
            #0D1220 25%,
            #141B2D 50%,
            #0D1220 75%,
            #0A0E17 100%
          );
          background-size: 400% 400%;
          animation: gradient 20s ease infinite;
        }

        .mosaic-bg::before {
          content: "";
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background:
            radial-gradient(ellipse 40% 60% at 20% 30%, rgba(139, 92, 246, 0.25) 0%, transparent 50%),
            radial-gradient(ellipse 50% 40% at 80% 20%, rgba(0, 242, 255, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse 35% 50% at 70% 70%, rgba(255, 0, 122, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse 45% 35% at 30% 80%, rgba(251, 191, 36, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse 30% 45% at 50% 50%, rgba(173, 255, 47, 0.1) 0%, transparent 40%);
          animation: aurora 15s ease-in-out infinite;
          z-index: 1;
        }

        .mosaic-bg::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 60% 40% at 10% 90%, rgba(0, 242, 255, 0.15) 0%, transparent 40%),
            radial-gradient(ellipse 40% 60% at 90% 10%, rgba(168, 85, 247, 0.18) 0%, transparent 45%);
          animation: aurora 12s ease-in-out infinite reverse;
          z-index: 1;
        }

        @keyframes aurora {
          0%, 100% { transform: translate(0%, 0%) rotate(0deg); opacity: 1; }
          25% { transform: translate(2%, -2%) rotate(1deg); opacity: 0.9; }
          50% { transform: translate(-1%, 1%) rotate(-1deg); opacity: 1; }
          75% { transform: translate(-2%, -1%) rotate(0.5deg); opacity: 0.95; }
        }

        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        .wave {
          border-radius: 1000% 1000% 0 0;
          position: fixed;
          width: 200%;
          height: 10em;
          transform: translate3d(0, 0, 0);
          bottom: 0;
          left: 0;
        }

        .wave:nth-of-type(1) {
          background: linear-gradient(90deg,
            rgba(0, 242, 255, 0.25) 0%,
            rgba(139, 92, 246, 0.25) 33%,
            rgba(255, 0, 122, 0.25) 66%,
            rgba(0, 242, 255, 0.25) 100%
          );
          animation: wave 12s -3s linear infinite;
          opacity: 0.7;
        }

        .wave:nth-of-type(2) {
          background: linear-gradient(90deg,
            rgba(255, 0, 122, 0.2) 0%,
            rgba(251, 191, 36, 0.2) 33%,
            rgba(173, 255, 47, 0.2) 66%,
            rgba(255, 0, 122, 0.2) 100%
          );
          bottom: -1em;
          animation: wave 16s linear reverse infinite;
          opacity: 0.55;
        }

        .wave:nth-of-type(3) {
          background: linear-gradient(90deg,
            rgba(139, 92, 246, 0.18) 0%,
            rgba(0, 242, 255, 0.18) 50%,
            rgba(139, 92, 246, 0.18) 100%
          );
          bottom: -2em;
          animation: wave 20s -1s reverse infinite;
          opacity: 0.45;
        }

        @keyframes wave {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-25%); }
          50% { transform: translateX(-50%); }
          75% { transform: translateX(-25%); }
        }

        @media (prefers-reduced-motion: reduce) {
          .mosaic-bg,
          .mosaic-bg::before,
          .mosaic-bg::after,
          .wave {
            animation: none;
          }
        }
      `}</style>

      {/* Clip-path reveal container — shrinks to circle(0%) on exit */}
      <motion.div
        className="fixed inset-0 z-[9998]"
        animate={{
          clipPath: isExiting
            ? "circle(0% at 50% 50%)"
            : "circle(150% at 50% 50%)",
        }}
        transition={{
          duration: 0.8,
          ease: [0.4, 0, 0.2, 1],
          delay: isExiting ? 0.15 : 0,
        }}
      >
        <div className="mosaic-bg" aria-hidden="true">
          <WorldMapBackground />
          <div className="wave" />
          <div className="wave" />
          <div className="wave" />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: isExiting ? 0 : 1,
            scale: isExiting ? 0.95 : 1,
          }}
          transition={
            isExiting
              ? { duration: 0.2 }
              : { duration: 0.3 }
          }
          className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto py-8"
        >
          {checkingAuth ? (
            <div className="flex flex-col items-center gap-4">
              <div
                className="w-8 h-8 border-t-2 rounded-full animate-spin"
                style={{ borderColor: "#00F2FF" }}
              />
              <div className="text-[#F1F5F9]/70 font-mono tracking-wider">
                INITIALIZING SYSTEM...
              </div>
            </div>
          ) : (
            <motion.div
              key={step}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", damping: 25 }}
              className="relative z-10 w-full max-w-xl px-4 flex justify-center"
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
      </motion.div>
    </>
  );
}

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
              setIsOnboarding(false);
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
  }, [setCurrentUser, setIsOnboarding]);

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
        <>
          <style jsx global>{`
            .mosaic-bg {
              position: fixed;
              inset: 0;
              z-index: 9998;
              pointer-events: none;
              overflow: hidden;
              isolation: isolate;
              background: linear-gradient(
                315deg,
                #0A0E17 6%,
                #141B2D 40%,
                #1E293B 72%,
                #0A0E17 100%
              );
              animation: gradient 15s ease infinite;
              background-size: 400% 400%;
              background-attachment: fixed;
            }

            .mosaic-bg::before {
              content: "";
              position: absolute;
              inset: 0;
              background: rgba(10, 14, 23, 0.78);
              z-index: 0;
            }

            @keyframes gradient {
              0% {
                background-position: 0% 0%;
              }
              50% {
                background-position: 100% 100%;
              }
              100% {
                background-position: 0% 0%;
              }
            }

            .wave {
              background: rgba(0, 242, 255, 0.16);
              border-radius: 1000% 1000% 0 0;
              position: fixed;
              width: 200%;
              height: 12em;
              animation: wave 10s -3s linear infinite;
              transform: translate3d(0, 0, 0);
              opacity: 0.6;
              bottom: 0;
              left: 0;
              z-index: 9998;
            }

            .wave:nth-of-type(2) {
              bottom: -1.25em;
              animation: wave 18s linear reverse infinite;
              opacity: 0.5;
            }

            .wave:nth-of-type(3) {
              bottom: -2.5em;
              animation: wave 20s -1s reverse infinite;
              opacity: 0.4;
            }

            @keyframes wave {
              2% {
                transform: translateX(0);
              }
              25% {
                transform: translateX(-25%);
              }
              50% {
                transform: translateX(-50%);
              }
              75% {
                transform: translateX(-25%);
              }
              100% {
                transform: translateX(0);
              }
            }

            @media (prefers-reduced-motion: reduce) {
              .mosaic-bg,
              .wave {
                animation: none;
              }
            }
          `}</style>
          <div className="mosaic-bg" aria-hidden="true">
            <div className="wave" />
            <div className="wave" />
            <div className="wave" />
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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
        </>
      )}
    </AnimatePresence>
  );
}

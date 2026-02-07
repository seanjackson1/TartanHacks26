"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Youtube, Gamepad2, Loader2, Sparkles } from "lucide-react";
import { siDiscord } from "simple-icons/icons";
import PlatformConnectButton from "./PlatformConnectButton";

interface OnboardingData {
  username: string;
  interests: string[];
  bio: string;
  ideology_score: number;
  instagram_handle: string;
  youtube_username: string;
  steam_id: string;
  github_username: string;
}

interface Props {
  onSubmit: (data: OnboardingData) => void;
  latitude: number | null;
  longitude: number | null;
  onRequestLocation: () => void;
  locationLoading: boolean;
  locationError: string | null;
}

export default function InterestInput({
  onSubmit,
  latitude,
  longitude,
  onRequestLocation,
  locationLoading,
  locationError,
}: Props) {
  const [username, setUsername] = useState("");
  const [interestsRaw, setInterestsRaw] = useState("");
  const [bio, setBio] = useState("");

  const [instagramHandle, setInstagramHandle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState({
    username: false,
    interests: false,
    location: false,
  });

  const interests = useMemo(
    () =>
      interestsRaw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    [interestsRaw]
  );

  const fieldErrors = useMemo(() => {
    return {
      username: !username.trim() ? "Username is required" : "",
      interests:
        interests.length === 0 ? "Add at least one interest" : "",
      location:
        latitude === null || longitude === null
          ? "Location is required"
          : "",
    };
  }, [username, interests, latitude, longitude]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    setTouched({ username: true, interests: true, location: true });
    if (fieldErrors.username || fieldErrors.interests || fieldErrors.location) {
      setError("Please fix the fields highlighted below.");
      return;
    }

    setIsSubmitting(true);
    onSubmit({
      username: username.trim(),
      interests,
      bio: bio.trim(),
      ideology_score: 5, // Default value (slider removed)
      instagram_handle: instagramHandle.trim(),
      youtube_username: "", // Handled via OAuth
      steam_id: "", // Handled via OAuth  
      github_username: "", // Handled via OAuth
    });
  };

  return (
    <div className="relative w-full max-w-xl">
      <form
        onSubmit={handleSubmit}
        className="mosaic-card w-full p-8 md:p-10 pb-12 flex flex-col gap-6 relative z-10"
      >
        <div className="text-center">
          <h1 
            className="text-2xl font-bold tracking-tight"
            style={{
              background: "linear-gradient(135deg, #00F2FF 0%, #8B5CF6 25%, #FF007A 50%, #FBBF24 75%, #ADFF2F 100%)",
              backgroundSize: "200% 200%",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "rainbow-shift 8s ease infinite",
            }}
          >
            Global Mosaic
          </h1>
          <p 
            className="text-sm mt-1"
            style={{
              background: "linear-gradient(90deg, #00F2FF, #8B5CF6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              opacity: 0.7,
            }}
          >
            Build a precise profile to find better matches.
          </p>
        </div>

        {/* Username */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs uppercase tracking-wider text-muted">
            Username *
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, username: true }))}
            placeholder="your_handle"
            className={`mosaic-input ${touched.username && fieldErrors.username
              ? "border-warn"
              : ""
              }`}
          />
          {touched.username && fieldErrors.username && (
            <p className="text-xs text-warn">{fieldErrors.username}</p>
          )}
        </div>

        {/* Interests */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs uppercase tracking-wider text-muted">
            Interests * (comma-separated)
          </label>
          <textarea
            value={interestsRaw}
            onChange={(e) => setInterestsRaw(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, interests: true }))}
            placeholder="lifting, sushi, Valorant, indie music, hiking..."
            rows={3}
            className={`mosaic-input resize-none ${touched.interests && fieldErrors.interests
              ? "border-warn"
              : ""
              }`}
          />
          {touched.interests && fieldErrors.interests && (
            <p className="text-xs text-warn">{fieldErrors.interests}</p>
          )}
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs uppercase tracking-wider text-muted">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
            rows={2}
            className="mosaic-input resize-none"
          />
        </div>

        {/* Instagram Handle */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs uppercase tracking-wider text-muted">
            Instagram
          </label>
          <input
            type="text"
            value={instagramHandle}
            onChange={(e) => setInstagramHandle(e.target.value)}
            placeholder="@yourhandle"
            className="mosaic-input"
          />
        </div>

        {/* Platform Integrations */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs uppercase tracking-wider text-muted">
            Connect Platforms (optional)
          </label>
          <div className="flex flex-col gap-2">
            <PlatformConnectButton
              provider="youtube"
              label="YouTube"
              icon={<Youtube className="w-4 h-4" />}
            />
            <PlatformConnectButton
              provider="steam"
              label="Steam"
              icon={<Gamepad2 className="w-4 h-4" />}
            />
            <PlatformConnectButton
              provider="discord"
              label="Discord"
              icon={
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  role="img"
                  aria-label="Discord"
                >
                  <path d={siDiscord.path} fill="currentColor" />
                </svg>
              }
            />
          </div>
        </div>

        {/* Location */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs uppercase tracking-wider text-muted">
            Location *
          </label>
          {latitude !== null && longitude !== null ? (
            <p className="text-sm text-foam/80">
              Captured: {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </p>
          ) : (
            <button
              type="button"
              onClick={onRequestLocation}
              disabled={locationLoading}
              onBlur={() => setTouched((t) => ({ ...t, location: true }))}
              className={`
                w-full py-3 rounded-lg font-medium transition-all duration-200
                flex items-center justify-center gap-2
                ${locationLoading
                  ? "bg-slate-800/50 border border-slate-700 text-slate-500 cursor-wait"
                  : "bg-[rgba(0,242,255,0.1)] hover:bg-[rgba(0,242,255,0.15)] border border-[rgba(0,242,255,0.3)] hover:border-[rgba(0,242,255,0.5)] text-[#00F2FF] shadow-[0_0_15px_rgba(0,242,255,0.05)] hover:shadow-[0_0_20px_rgba(0,242,255,0.15)]"
                }
                ${touched.location && fieldErrors.location
                  ? "!border-warn !text-warn !bg-warn/10 !shadow-none"
                  : ""
                }`}
            >
              {locationLoading ? "Locating..." : "Share My Location"}
            </button>
          )}
          {locationError && (
            <p className="text-xs text-warn">{locationError}</p>
          )}
          {touched.location && fieldErrors.location && (
            <p className="text-xs text-warn">{fieldErrors.location}</p>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-warn text-center">{error}</p>
        )}

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={isSubmitting}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="w-full py-4 rounded-xl font-bold text-lg mb-4 transition-all duration-200 relative overflow-hidden disabled:opacity-70 disabled:cursor-wait"
          style={{
            background: isSubmitting 
              ? "rgba(20, 27, 45, 0.8)" 
              : "linear-gradient(135deg, rgba(0, 242, 255, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
            color: "#F1F5F9",
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(0, 242, 255, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)";
              e.currentTarget.style.borderColor = "rgba(0, 242, 255, 0.4)";
              e.currentTarget.style.boxShadow = "0 8px 30px rgba(0, 242, 255, 0.15)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.background = "linear-gradient(135deg, rgba(0, 242, 255, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
              e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.2)";
            }
          }}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-foam" />
              Building Your Mosaic...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-foam" />
              Find My People
            </span>
          )}
        </motion.button>
      </form>
      <style jsx>{`
        /* Card - Night Sky gradient */
        .mosaic-card {
          background: linear-gradient(
            180deg, 
            rgba(10, 14, 23, 0.97), 
            rgba(20, 27, 45, 0.95)
          );
          border: 1px solid rgba(30, 41, 59, 0.6);
          box-shadow: 
            0 10px 40px rgba(10, 14, 23, 0.7),
            0 0 80px rgba(0, 242, 255, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.03);
          border-radius: 16px;
        }

        /* Inputs - Slate Blue borders */
        .mosaic-input {
          background: rgba(10, 14, 23, 0.7);
          border: 1px solid #1E293B;
          border-radius: 8px;
          padding: 0.625rem 0.875rem;
          color: #F1F5F9;
          transition: all 200ms ease;
        }

        .mosaic-input::placeholder {
          color: #64748B;
        }

        .mosaic-input:focus {
          outline: none;
          border-color: #00F2FF;
          box-shadow: 0 0 0 3px rgba(0, 242, 255, 0.15);
        }

        .mosaic-input:hover:not(:focus) {
          border-color: rgba(0, 242, 255, 0.4);
        }

        /* Secondary buttons */
        .mosaic-secondary {
          background: rgba(20, 27, 45, 0.6);
          border: 1px solid #1E293B;
          border-radius: 8px;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          color: #F1F5F9;
          transition: all 200ms ease;
        }

        .mosaic-secondary:hover {
          background: rgba(0, 242, 255, 0.08);
          border-color: #00F2FF;
        }

        /* Core Colors */
        .text-cloud { color: #F1F5F9; }
        .text-muted { color: #64748B; }
        .text-foam { color: #00F2FF; }
        .text-abyss { color: #0A0E17; }
        
        /* Accent Colors */
        .text-cyan { color: #00F2FF; }
        .text-magenta { color: #FF007A; }
        .text-lime { color: #ADFF2F; }
        .text-orange { color: #FFA500; }
        .text-purple { color: #8B5CF6; }
        .text-golden { color: #FBBF24; }
        
        /* Semantic Colors */
        .text-success { color: #22C55E; }
        .text-warn { color: #F59E0B; }
        .text-error { color: #EF4444; }
        .text-info { color: #3B82F6; }
        
        /* Border Colors */
        .border-warn { border-color: #F59E0B; }
        .border-error { border-color: #EF4444; }
        
        /* Background Colors */
        .bg-deep-space { background-color: #0A0E17; }
        .bg-midnight { background-color: #141B2D; }
        .bg-slate { background-color: #1E293B; }
        .bg-cyan { background-color: #00F2FF; }
        .bg-foam { background-color: #00F2FF; }
        .bg-cta {
          background: linear-gradient(135deg, #00F2FF 0%, #8B5CF6 100%);
          border: 2px solid rgba(255, 255, 255, 0.3);
        }
        .bg-cta-strong {
          background: linear-gradient(135deg, #3AF7FF 0%, #A78BFA 100%);
          border: 2px solid rgba(255, 255, 255, 0.4);
        }
        .bg-cta-muted {
          background: linear-gradient(
            135deg,
            rgba(0, 242, 255, 0.5) 0%,
            rgba(139, 92, 246, 0.5) 100%
          );
          border: 2px solid rgba(255, 255, 255, 0.15);
        }
        
        /* Vibrant CTA - Maximum standout */
        .bg-cta-vibrant {
          background: linear-gradient(135deg, #00F2FF 0%, #00D4E0 30%, #8B5CF6 70%, #A855F7 100%);
          border: 2px solid rgba(255, 255, 255, 0.5);
        }
        .bg-cta-vibrant-hover {
          background: linear-gradient(135deg, #3AF7FF 0%, #22D4E8 30%, #A78BFA 70%, #C084FC 100%);
          border: 2px solid rgba(255, 255, 255, 0.6);
        }
        
        .shadow-cta {
          box-shadow:
            0 0 20px rgba(0, 242, 255, 0.5),
            0 0 40px rgba(139, 92, 246, 0.3),
            0 8px 32px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.25);
        }
        .shadow-cta:hover {
          box-shadow:
            0 0 30px rgba(0, 242, 255, 0.7),
            0 0 60px rgba(139, 92, 246, 0.5),
            0 12px 40px rgba(0, 0, 0, 0.5),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }
        
        /* Intense glow for vibrant CTA */
        .shadow-cta-glow {
          box-shadow:
            0 0 30px rgba(0, 242, 255, 0.7),
            0 0 60px rgba(139, 92, 246, 0.5),
            0 0 100px rgba(0, 242, 255, 0.3),
            0 10px 40px rgba(0, 0, 0, 0.5),
            inset 0 2px 0 rgba(255, 255, 255, 0.4);
          animation: pulse-glow 2s ease-in-out infinite;
        }
        .shadow-cta-glow:hover {
          box-shadow:
            0 0 40px rgba(0, 242, 255, 0.9),
            0 0 80px rgba(139, 92, 246, 0.7),
            0 0 120px rgba(0, 242, 255, 0.4),
            0 15px 50px rgba(0, 0, 0, 0.6),
            inset 0 2px 0 rgba(255, 255, 255, 0.5);
          animation: none;
        }
        
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow:
              0 0 30px rgba(0, 242, 255, 0.7),
              0 0 60px rgba(139, 92, 246, 0.5),
              0 0 100px rgba(0, 242, 255, 0.3),
              0 10px 40px rgba(0, 0, 0, 0.5),
              inset 0 2px 0 rgba(255, 255, 255, 0.4);
          }
          50% {
            box-shadow:
              0 0 40px rgba(0, 242, 255, 0.85),
              0 0 80px rgba(139, 92, 246, 0.65),
              0 0 120px rgba(0, 242, 255, 0.4),
              0 10px 40px rgba(0, 0, 0, 0.5),
              inset 0 2px 0 rgba(255, 255, 255, 0.5);
          }
        }
        
        @keyframes rainbow-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </div>
  );
}

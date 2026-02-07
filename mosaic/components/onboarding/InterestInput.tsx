"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Youtube, Gamepad2, Github, Loader2, Sparkles } from "lucide-react";
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
        className="glass mosaic-card w-full p-8 md:p-10 pb-12 flex flex-col gap-6 relative z-10"
      >
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foam">
            Global Mosaic
          </h1>
          <p className="text-sm text-foreground/60 mt-1">
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
              provider="github"
              label="GitHub"
              icon={<Github className="w-4 h-4" />}
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
              className={`mosaic-secondary ${locationLoading
                ? "border-foam/20 text-foam/60"
                : "border-foam/30 text-foam hover:bg-foam/10"
                } ${touched.location && fieldErrors.location
                  ? "border-warn text-warn"
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
          className={`
          w-full py-3 rounded-md font-semibold mb-4
          transition-all duration-150 relative overflow-hidden
          ${isSubmitting
              ? 'bg-foam/50 cursor-wait'
              : 'bg-foam hover:bg-foam/90'}
          text-abyss
          disabled:opacity-70
        `}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Building Your Mosaic...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5" />
              Find My People
            </span>
          )}
        </motion.button>
      </form>
      <style jsx>{`
        .mosaic-card {
          background: linear-gradient(
            180deg, 
            rgba(2, 6, 23, 0.95), 
            rgba(10, 37, 64, 0.92)
          );
          border: 1px solid rgba(126, 230, 230, 0.12);
          box-shadow: 
            0 10px 40px rgba(2, 6, 23, 0.6),
            0 0 60px rgba(15, 185, 177, 0.08),
            inset 0 1px 0 rgba(126, 230, 230, 0.05);
          border-radius: 16px;
        }

        .mosaic-input {
          background: rgba(2, 6, 23, 0.6);
          border: 1px solid rgba(15, 185, 177, 0.15);
          border-radius: 8px;
          padding: 0.625rem 0.875rem;
          color: rgba(255, 255, 255, 0.9);
          transition: all 200ms ease;
        }

        .mosaic-input::placeholder {
          color: rgba(126, 230, 230, 0.35);
        }

        .mosaic-input:focus {
          outline: none;
          border-color: #0FB9B1;
          box-shadow: 0 0 0 3px rgba(15, 185, 177, 0.15);
        }

        .mosaic-input:hover:not(:focus) {
          border-color: rgba(15, 185, 177, 0.3);
        }

        .mosaic-secondary {
          background: rgba(10, 37, 64, 0.5);
          border: 1px solid rgba(15, 185, 177, 0.25);
          border-radius: 8px;
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          transition: all 200ms ease;
        }

        .mosaic-secondary:hover {
          background: rgba(15, 185, 177, 0.1);
          border-color: rgba(15, 185, 177, 0.4);
        }

        .text-foam { color: #7EE6E6; }
        .text-teal { color: #0FB9B1; }
        .text-violet { color: #6A5ACD; }
        .text-muted { color: rgba(126, 230, 230, 0.5); }
        .text-warn { color: #FF6B8A; }
        .text-abyss { color: #020617; }
        .border-warn { border-color: #FF6B8A; }
        .bg-foam { background-color: #7EE6E6; }
        .bg-teal { background-color: #0FB9B1; }
        .bg-deep-sea { background-color: #0A2540; }
        .bg-abyss { background-color: #020617; }
      `}</style>
    </div>
  );
}

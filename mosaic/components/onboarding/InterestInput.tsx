"use client";

import { useState } from "react";

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
  const [ideologyScore, setIdeologyScore] = useState(5);
  const [instagramHandle, setInstagramHandle] = useState("");
  const [youtubeUsername, setYoutubeUsername] = useState("");
  const [steamId, setSteamId] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError("Username is required");
      return;
    }
    if (!interestsRaw.trim()) {
      setError("Add at least one interest");
      return;
    }
    if (latitude === null || longitude === null) {
      setError("Location is required — click the button above");
      return;
    }

    const interests = interestsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    onSubmit({
      username: username.trim(),
      interests,
      bio: bio.trim(),
      ideology_score: ideologyScore,
      instagram_handle: instagramHandle.trim(),
      youtube_username: youtubeUsername.trim(),
      steam_id: steamId.trim(),
      github_username: githubUsername.trim(),
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="glass w-full max-w-md p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto"
    >
      <div className="text-center">
        <h1 className="text-2xl font-bold text-cyan">Global Mosaic</h1>
        <p className="text-sm text-foreground/60 mt-1">
          Build your profile
        </p>
      </div>

      {/* Username */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs uppercase tracking-wider text-foreground/50">
          Username *
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="your_handle"
          className="bg-white/5 border border-glass-border rounded-lg px-3 py-2 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-cyan/50"
        />
      </div>

      {/* Interests */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs uppercase tracking-wider text-foreground/50">
          Interests * (comma-separated)
        </label>
        <textarea
          value={interestsRaw}
          onChange={(e) => setInterestsRaw(e.target.value)}
          placeholder="lifting, sushi, Valorant, indie music, hiking..."
          rows={3}
          className="bg-white/5 border border-glass-border rounded-lg px-3 py-2 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-cyan/50 resize-none"
        />
      </div>

      {/* Bio */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs uppercase tracking-wider text-foreground/50">
          Bio
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us about yourself..."
          rows={2}
          className="bg-white/5 border border-glass-border rounded-lg px-3 py-2 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-cyan/50 resize-none"
        />
      </div>

      {/* Ideology Slider */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs uppercase tracking-wider text-foreground/50">
          Ideology ({ideologyScore}/10)
        </label>
        <input
          type="range"
          min={1}
          max={10}
          value={ideologyScore}
          onChange={(e) => setIdeologyScore(Number(e.target.value))}
          className="w-full accent-cyan"
        />
        <div className="flex justify-between text-[10px] text-foreground/40">
          <span>Progressive</span>
          <span>Conservative</span>
        </div>
      </div>

      {/* Instagram Handle */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs uppercase tracking-wider text-foreground/50">
          Instagram
        </label>
        <input
          type="text"
          value={instagramHandle}
          onChange={(e) => setInstagramHandle(e.target.value)}
          placeholder="@yourhandle"
          className="bg-white/5 border border-glass-border rounded-lg px-3 py-2 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-cyan/50"
        />
      </div>

      {/* Platform Integrations */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs uppercase tracking-wider text-foreground/50">
          Connect Platforms (optional)
        </label>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={youtubeUsername}
            onChange={(e) => setYoutubeUsername(e.target.value)}
            placeholder="YouTube username"
            className="bg-white/5 border border-glass-border rounded-lg px-3 py-2 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-cyan/50"
          />
          <input
            type="text"
            value={steamId}
            onChange={(e) => setSteamId(e.target.value)}
            placeholder="Steam ID"
            className="bg-white/5 border border-glass-border rounded-lg px-3 py-2 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-cyan/50"
          />
          <input
            type="text"
            value={githubUsername}
            onChange={(e) => setGithubUsername(e.target.value)}
            placeholder="GitHub username"
            className="bg-white/5 border border-glass-border rounded-lg px-3 py-2 text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-cyan/50"
          />
        </div>
      </div>

      {/* Location */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs uppercase tracking-wider text-foreground/50">
          Location *
        </label>
        {latitude !== null && longitude !== null ? (
          <p className="text-sm text-green-neon">
            Captured: {latitude.toFixed(4)}, {longitude.toFixed(4)}
          </p>
        ) : (
          <button
            type="button"
            onClick={onRequestLocation}
            disabled={locationLoading}
            className="bg-cyan/10 border border-cyan/20 text-cyan rounded-lg px-3 py-2 text-sm hover:bg-cyan/20 transition-colors disabled:opacity-50"
          >
            {locationLoading ? "Locating..." : "Share My Location"}
          </button>
        )}
        {locationError && (
          <p className="text-xs text-magenta">{locationError}</p>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-magenta text-center">{error}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        className="w-full py-3 rounded-lg bg-cyan text-background font-semibold hover:bg-cyan/80 transition-colors"
      >
        Find My People
      </button>
    </form>
  );
}

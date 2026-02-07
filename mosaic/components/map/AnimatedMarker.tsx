"use client";

import { Marker } from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";
import type { User } from "@/types/api";

interface Props {
  user: User;
  delay: number;
  score: number; // 0 to 1
  onClick: () => void;
}

export default function AnimatedMarker({ user, delay, score, onClick }: Props) {
  // Start visible immediately if delay is 0, otherwise animate in
  const [visible, setVisible] = useState(delay === 0);

  useEffect(() => {
    if (delay === 0) {
      setVisible(true);
      return;
    }
    const timer = setTimeout(() => {
      setVisible(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!visible) return null;
  if (!Number.isFinite(user.latitude) || !Number.isFinite(user.longitude))
    return null;

  // Determine glow intensity based on score
  // Show glow for 70%+ matches, linear scaling so 80%+ is relatively strong
  const showGlow = score >= 0.7;
  const glowIntensity = showGlow ? (score - 0.7) / 0.3 : 0; // Linear scaling 0-1 for 70-100%
  const glowSize = 6 + glowIntensity * 14; // 6px to 20px glow
  const glowOpacity = 0.5 + glowIntensity * 0.4; // 0.5 to 0.9

  // Slightly reduced opacity for low matches
  const dotOpacity = score < 0.25 ? 0.6 : 1;

  const color = user.marker_color ?? "#00F2FF";

  // Create custom divIcon with CSS shadow
  const markerIcon = L.divIcon({
    html: `<div style="
      width: 12px;
      height: 12px;
      background-color: ${color};
      border-radius: 50%;
      opacity: ${dotOpacity};
      ${showGlow ? `box-shadow: 0 0 ${glowSize}px ${glowSize / 2}px ${color};` : ''}
      transition: all 0.3s ease;
    "></div>`,
    className: "custom-marker-icon",
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });

  return (
    <Marker
      position={[user.latitude, user.longitude]}
      icon={markerIcon}
      eventHandlers={{ click: onClick }}
    />
  );
}


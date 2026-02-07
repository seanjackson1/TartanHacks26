"use client";

import { CircleMarker } from "react-leaflet";
import { useEffect, useState } from "react";
import type { User } from "@/types/api";

interface Props {
  user: User;
  delay: number;
  onClick: () => void;
}

export default function AnimatedMarker({ user, delay, onClick }: Props) {
  const [visible, setVisible] = useState(false);
  const [radius, setRadius] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
      let start: number | null = null;
      const animate = (ts: number) => {
        if (start === null) start = ts;
        const progress = Math.min((ts - start) / 300, 1);
        setRadius(progress * 6);
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  if (!visible) return null;
  if (!Number.isFinite(user.latitude) || !Number.isFinite(user.longitude))
    return null;

  return (
    <CircleMarker
      center={[user.latitude, user.longitude]}
      radius={radius}
      pathOptions={{
        fillColor: user.marker_color ?? "#00F2FF",
        fillOpacity: 0.85,
        color: user.marker_color ?? "#00F2FF",
        weight: 1,
        opacity: 0.4,
      }}
      eventHandlers={{ click: onClick }}
    />
  );
}

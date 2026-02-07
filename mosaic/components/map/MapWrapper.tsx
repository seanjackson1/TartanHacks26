"use client";

import { useAppStore } from "@/store/useAppStore";
import MosaicMap from "./MapContainer";

export default function MapWrapper() {
  const markers = useAppStore((s) => s.markers);
  const currentUser = useAppStore((s) => s.currentUser);

  const allMarkers = currentUser ? [currentUser, ...markers] : markers;

  return <MosaicMap markers={allMarkers} />;
}

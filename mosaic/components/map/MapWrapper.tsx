"use client";

import { useAppStore } from "@/store/useAppStore";
import MosaicMap from "./MapContainer";

export default function MapWrapper() {
  const markers = useAppStore((s) => s.markers);
  const currentUser = useAppStore((s) => s.currentUser);

  const allMarkers = currentUser
    ? [currentUser, ...markers.filter((m) => m.id !== currentUser.id)]
    : markers;

  return <MosaicMap markers={allMarkers} />;
}

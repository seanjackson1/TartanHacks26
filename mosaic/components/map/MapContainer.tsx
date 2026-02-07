"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  TILE_URL,
  TILE_ATTRIBUTION,
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
} from "@/lib/constants";
import { useAppStore } from "@/store/useAppStore";
import type { User } from "@/types/api";
import type { MatchResult } from "@/types/api";
import AnimatedMarker from "./AnimatedMarker";

import { latLngBounds } from "leaflet";

function FlyToHandler() {
  const map = useMap();
  const selectedMatch = useAppStore((s) => s.selectedMatch);

  useEffect(() => {
    if (
      selectedMatch &&
      Number.isFinite(selectedMatch.user.latitude) &&
      Number.isFinite(selectedMatch.user.longitude)
    ) {
      map.flyTo(
        [selectedMatch.user.latitude, selectedMatch.user.longitude],
        15, // Reduced zoom level from 15
        { duration: 1.5 }
      );
    }
  }, [selectedMatch, map]);

  return null;
}

function FitBoundsHandler({ markers }: { markers: User[] }) {
  const map = useMap();
  const matches = useAppStore((s) => s.matches);

  useEffect(() => {
    if (matches.length > 0 && markers.length > 0) {
      const validMarkers = markers.filter(
        (m) => Number.isFinite(m.latitude) && Number.isFinite(m.longitude)
      );

      if (validMarkers.length > 0) {
        const bounds = latLngBounds(
          validMarkers.map((m) => [m.latitude, m.longitude])
        );
        map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
      }
    }
  }, [matches, markers, map]);

  return null;
}

export default function MosaicMap({ markers }: { markers: User[] }) {
  const [isMounted, setIsMounted] = useState(false);
  const matches = useAppStore((s) => s.matches);
  const setSelectedMatch = useAppStore((s) => s.setSelectedMatch);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="w-screen h-screen bg-background" />;
  }

  const findMatch = (userId: string): MatchResult | null =>
    matches.find((m) => m.user.id === userId) ?? null;

  return (
    <div className="map-crosshair">
      <MapContainer
        center={DEFAULT_MAP_CENTER}
        zoom={DEFAULT_MAP_ZOOM}
        minZoom={3}
        zoomControl={false}
        attributionControl={false}
        preferCanvas={true}
        className="w-screen h-screen"
        maxBounds={[[-90, -180], [90, 180]]}
        maxBoundsViscosity={1.0}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} noWrap={true} />
        <FlyToHandler />
        <FitBoundsHandler markers={markers} />
        {markers
          .filter(
            (u) =>
              Number.isFinite(u.latitude) && Number.isFinite(u.longitude)
          )
          .map((user, i) => (
            <AnimatedMarker
            key={user.id}
            user={user}
            delay={i * 50}
            onClick={() => {
              const match = findMatch(user.id);
              if (match) setSelectedMatch(match);
            }}
          />
        ))}
      </MapContainer>
    </div>
  );
}

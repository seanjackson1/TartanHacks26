"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L, { latLngBounds } from "leaflet";
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

function FlyToHandler() {
  const map = useMap();
  const selectedMatch = useAppStore((s) => s.selectedMatch);
  const prevSelectedMatch = useRef(selectedMatch);

  useEffect(() => {
    // Zoom in when selecting a match
    if (
      selectedMatch &&
      Number.isFinite(selectedMatch.user.latitude) &&
      Number.isFinite(selectedMatch.user.longitude)
    ) {
      map.flyTo(
        [selectedMatch.user.latitude, selectedMatch.user.longitude],
        15,
        { duration: 1.5 }
      );
    }
    // Zoom out to level 3 when closing profile (match goes from selected to null)
    else if (!selectedMatch && prevSelectedMatch.current) {
      map.flyTo(map.getCenter(), 3, { duration: 1.5 });
    }

    prevSelectedMatch.current = selectedMatch;
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

// Force map to redraw markers after zoom ends
function MapRefreshHandler() {
  const map = useMap();

  useEffect(() => {
    const handleZoomEnd = () => {
      // Invalidate map size to force redraw of all layers
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    };

    map.on("zoomend", handleZoomEnd);
    return () => {
      map.off("zoomend", handleZoomEnd);
    };
  }, [map]);

  return null;
}

// Minimalistic cluster icon
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createClusterIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  const size = Math.min(24 + count * 2, 40);

  return L.divIcon({
    html: `<div style="
      width: ${size}px;
      height: ${size}px;
      background: rgba(0, 242, 255, 0.15);
      border: 1px solid rgba(0, 242, 255, 0.5);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #00F2FF;
      font-weight: 500;
      font-size: 11px;
      font-family: ui-monospace, monospace;
      backdrop-filter: blur(4px);
    ">${count}</div>`,
    className: "custom-cluster-icon",
    iconSize: L.point(size, size),
  });
};

export default function MosaicMap({ markers }: { markers: User[] }) {
  const [isMounted, setIsMounted] = useState(false);
  const matches = useAppStore((s) => s.matches);
  const currentUser = useAppStore((s) => s.currentUser);
  const setSelectedMatch = useAppStore((s) => s.setSelectedMatch);
  const setSelectedIndex = useAppStore((s) => s.setSelectedIndex);

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
        <MapRefreshHandler />
        <MarkerClusterGroup
          iconCreateFunction={createClusterIcon}
          maxClusterRadius={50}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          zoomToBoundsOnClick={true}
          disableClusteringAtZoom={12}
          removeOutsideVisibleBounds={false}
          animate={false}
        >
          {markers
            .filter(
              (u) =>
                Number.isFinite(u.latitude) && Number.isFinite(u.longitude)
            )
            .map((user, i) => {
              const match = findMatch(user.id);
              const matchIndex = matches.findIndex((m) => m.user.id === user.id);
              return (
                <AnimatedMarker
                  key={user.id}
                  user={user}
                  delay={0}
                  score={match?.similarity_score ?? 0}
                  isCurrentUser={currentUser?.id === user.id}
                  onClick={() => {
                    if (match) {
                      setSelectedMatch(match);
                      setSelectedIndex(matchIndex);
                    }
                  }}
                />
              );
            })}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}

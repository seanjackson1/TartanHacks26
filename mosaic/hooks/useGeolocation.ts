"use client";

import { useState, useCallback } from "react";

interface GeoState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [geo, setGeo] = useState<GeoState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: false,
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeo((prev) => ({ ...prev, error: "Geolocation not supported" }));
      return;
    }
    setGeo((prev) => ({ ...prev, loading: true, error: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setGeo({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          error: null,
          loading: false,
        }),
      (err) =>
        setGeo({
          latitude: null,
          longitude: null,
          error: err.message,
          loading: false,
        }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return { ...geo, requestLocation };
}

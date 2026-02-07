"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";

// Simplified Mercator projection to convert Lat/Lon to SVG coordinates
// Canvas/SVG width = 1000, height = 500 (2:1 aspect ratio)
const WIDTH = 1000;
const HEIGHT = 500;

const project = (lat: number, lon: number): [number, number] => {
  const x = (lon + 180) * (WIDTH / 360);
  const latRad = (lat * Math.PI) / 180;
  const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  const y = HEIGHT / 2 - (WIDTH * mercN) / (2 * Math.PI);
  // Cap Y to prevent infinite values at poles
  return [x, Math.max(0, Math.min(HEIGHT, y))];
};

interface Feature {
  type: "Feature";
  geometry: {
    type: "Polygon" | "MultiPolygon";
    coordinates: number[][][] | number[][][][]; // Simple or nested arrays
  };
  properties: {
    name: string;
  };
}

interface GeoJSON {
  type: "FeatureCollection";
  features: Feature[];
}

const THEME_COLORS = [
  "#00F2FF", // Cyan
  "#FF007A", // Magenta
  "#ADFF2F", // Lime
  "#FFA500", // Orange
  "#8B5CF6", // Purple
];

export default function WorldMapBackground() {
  const [geoData, setGeoData] = useState<GeoJSON | null>(null);
  const [paths, setPaths] = useState<{ d: string; color: string; delay: number }[]>([]);

  useEffect(() => {
    // Fetch low-res world map
    fetch("https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json")
      .then((res) => res.json())
      .then((data: GeoJSON) => {
        setGeoData(data);
      })
      .catch((err) => console.error("Failed to load map data", err));
  }, []);

  useEffect(() => {
    if (!geoData) return;

    const newPaths = geoData.features.map((feature, i) => {
      let d = "";
      const geometry = feature.geometry;

      const processPolygon = (coords: number[][]) => {
        let path = "";
        coords.forEach((point, i) => {
          const [lon, lat] = point;
          const [x, y] = project(lat, lon);
          if (i === 0) path += `M${x},${y}`;
          else path += `L${x},${y}`;
        });
        path += "Z ";
        return path;
      };

      if (geometry.type === "Polygon") {
        (geometry.coordinates as number[][][]).forEach((coords) => {
          d += processPolygon(coords);
        });
      } else if (geometry.type === "MultiPolygon") {
        (geometry.coordinates as number[][][][]).forEach((poly) => {
          poly.forEach((coords) => {
            d += processPolygon(coords);
          });
        });
      }

      return {
        d,
        color: THEME_COLORS[Math.floor(Math.random() * THEME_COLORS.length)],
        delay: Math.random() * 5, // Random delay for animation
      };
    });

    setPaths(newPaths);
  }, [geoData]);

  if (!paths.length) return null;

  return (
    <div className="fixed inset-0 z-0 flex items-center justify-center opacity-60 pointer-events-none overflow-hidden">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-[120%] h-[120%] text-white/10 mix-blend-screen"
        preserveAspectRatio="xMidYMid slice"
        style={{
          filter: "blur(0.5px)",
        }}
      >
        {paths.map((p, i) => (
          <motion.path
            key={i}
            d={p.d}
            fill={p.color}
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: p.delay
            }}
            stroke="none"
            style={{ mixBlendMode: "plus-lighter" }}
          />
        ))}
      </svg>
      
      {/* Vignette to fade edges */}
      <div 
        className="absolute inset-0 z-10"
        style={{
          background: "radial-gradient(circle, transparent 20%, #0A0E17 100%)"
        }}
      />
    </div>
  );
}

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const CLUSTER_COLORS = {
  tech: "#00F2FF",
  arts: "#FF007A",
  gaming: "#ADFF2F",
  fitness: "#FFA500",
} as const;

export const DEFAULT_MAP_CENTER: [number, number] = [40.4433, -79.9436]; // Pittsburgh (CMU)
export const DEFAULT_MAP_ZOOM = 13;

export const TILE_URL =
  "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png";
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>';

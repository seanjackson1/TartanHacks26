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
  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
export const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

export type Mode = "harmony" | "contrast";
export type InterestSource = "youtube" | "steam" | "github" | "manual";

export interface User {
  id: string;
  username: string;
  bio?: string;
  ideology_score?: number;
  latitude: number;
  longitude: number;
  instagram_handle?: string;
  youtube_username?: string;
  steam_id?: string;
  github_username?: string;
  marker_color?: string;
  metadata?: Record<string, unknown>;
  dna_string?: string;
}

export interface IngestRequest {
  username: string;
  interests: string[];
  latitude: number;
  longitude: number;
  bio?: string;
  ideology_score?: number;
  instagram_handle?: string;
  youtube_username?: string;
  steam_id?: string;
  github_username?: string;
}

export interface IngestResponse {
  user_id: string;
  marker_color: string;
  message: string;
}

export interface SearchRequest {
  user_id: string;
  mode: Mode;
  limit?: number;
  radius_km?: number;
}

export interface MatchResult {
  user: User;
  similarity_score: number;
  ideological_distance?: number;
  composite_score?: number;
  distance_km?: number;
}

export interface SearchResponse {
  matches: MatchResult[];
  total_found: number;
  mode: Mode;
}

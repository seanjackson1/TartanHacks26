import { create } from "zustand";
import type { User, MatchResult, Mode } from "@/types/api";

interface AppState {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;

  markers: User[];
  setMarkers: (markers: User[]) => void;
  addMarkers: (newMarkers: User[]) => void;

  mode: Mode;
  setMode: (mode: Mode) => void;
  matches: MatchResult[];
  setMatches: (matches: MatchResult[]) => void;
  isSearching: boolean;
  setIsSearching: (v: boolean) => void;

  selectedMatch: MatchResult | null;
  setSelectedMatch: (match: MatchResult | null) => void;

  isOnboarding: boolean;
  setIsOnboarding: (v: boolean) => void;

  isLoading: boolean;
  loadingMessage: string;
  setLoading: (isLoading: boolean, message?: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  markers: [],
  setMarkers: (markers) => set({ markers }),
  addMarkers: (newMarkers) =>
    set((s) => ({
      markers: [
        ...s.markers,
        ...newMarkers.filter((n) => !s.markers.some((m) => m.id === n.id)),
      ],
    })),

  mode: "harmony",
  setMode: (mode) => set({ mode }),
  matches: [],
  setMatches: (matches) => set({ matches }),
  isSearching: false,
  setIsSearching: (v) => set({ isSearching: v }),

  selectedMatch: null,
  setSelectedMatch: (match) => set({ selectedMatch: match }),

  isOnboarding: true,
  setIsOnboarding: (v) => set({ isOnboarding: v }),

  isLoading: false,
  loadingMessage: "",
  setLoading: (isLoading, message = "") => set({ isLoading, loadingMessage: message }),
}));

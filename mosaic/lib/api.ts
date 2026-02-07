import { API_BASE_URL } from "./constants";
import type {
  IngestRequest,
  IngestResponse,
  SearchRequest,
  SearchResponse,
} from "@/types/api";

import { supabase } from "@/lib/supabase";

async function post<TReq, TRes>(path: string, body: TReq): Promise<TRes> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
     // In a real app, might want to redirect to login or throw specific error
     console.warn("No auth token found for request to", path);
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`API Error details for ${path}:`, err, res.status);
    throw new Error(`API ${path} failed (${res.status}): ${err}`);
  }
  return res.json();
}

export const api = {
  ingest: (data: IngestRequest) =>
    post<IngestRequest, IngestResponse>("/ingest", data),
  search: (data: SearchRequest) =>
    post<SearchRequest, SearchResponse>("/search", data),
};

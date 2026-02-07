import { API_BASE_URL } from "./constants";
import type {
  IngestRequest,
  IngestResponse,
  SearchRequest,
  SearchResponse,
} from "@/types/api";

async function post<TReq, TRes>(path: string, body: TReq): Promise<TRes> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
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

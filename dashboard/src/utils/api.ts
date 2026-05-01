import type { Listing, ListingsResponse } from "../types";

const CONFIG = window.hiddenDealsConfig ?? {};
const BASE_URL = CONFIG.apiUrl || import.meta.env.VITE_API_URL || "http://localhost:3000/api/listings";

/**
 * Fetch all listings from the API.
 * Requests a high limit to get everything in one call.
 */
export async function fetchListings(): Promise<Listing[]> {
  const res = await fetch(`${BASE_URL}?limit=9999`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`API responded with ${res.status} ${res.statusText}`);
  }

  const json: ListingsResponse | Listing[] = await res.json();
  return Array.isArray(json) ? json : json.data ?? [];
}

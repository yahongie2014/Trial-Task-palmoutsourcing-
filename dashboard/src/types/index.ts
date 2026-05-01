// ============================================================
// Domain Types
// ============================================================

/** A single property listing as returned by the API */
export interface Listing {
  property_id: string;
  title: string;
  price: string;
  location: string;
  link: string;
  postcode: string;
  bedrooms: number | null;
  property_type: string;
  image_url?: string;
  added_date: string;
}

/** Paginated API response shape */
export interface ListingsResponse {
  total: number;
  page: number;
  limit: number;
  pages: number;
  data: Listing[];
}

// ============================================================
// Filter Types
// ============================================================

export interface FilterState {
  search: string;
  minPrice: string;
  maxPrice: string;
  bedrooms: string;
  propertyType: string;
}

export const INITIAL_FILTERS: FilterState = {
  search: "",
  minPrice: "",
  maxPrice: "",
  bedrooms: "",
  propertyType: "",
};

// ============================================================
// Sort Types
// ============================================================

export type SortKey =
  | "title"
  | "price"
  | "location"
  | "bedrooms"
  | "property_type"
  | "added_date";

export type SortDirection = "asc" | "desc";

export interface SortState {
  key: SortKey;
  direction: SortDirection;
}

export const INITIAL_SORT: SortState = {
  key: "added_date",
  direction: "desc",
};

// ============================================================
// Stats Types
// ============================================================

export interface DashboardStats {
  total: number;
  filtered: number;
  avgPrice: number;
  cheapest: Listing | null;
  mostExpensive: Listing | null;
  topLocations: { name: string; count: number }[];
  typeBreakdown: { name: string; count: number }[];
  dataMinPrice: number;
  dataMaxPrice: number;
}

import { useState, useMemo, useEffect } from "react";
import type { Listing, FilterState, SortState, DashboardStats } from "../types";
import { INITIAL_FILTERS, INITIAL_SORT } from "../types";
import { parsePrice } from "../utils/price";
import { fetchListings } from "../utils/api";

export function useDashboard() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [sort, setSort] = useState<SortState>(INITIAL_SORT);
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  // Load Data
  useEffect(() => {
    fetchListings()
      .then(setListings)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Filter Logic
  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const searchTarget = `${l.title} ${l.location} ${l.postcode}`.toLowerCase();
        if (!searchTarget.includes(q)) return false;
      }
      if (filters.minPrice && parsePrice(l.price) < Number(filters.minPrice)) return false;
      if (filters.maxPrice && parsePrice(l.price) > Number(filters.maxPrice)) return false;
      if (filters.bedrooms && l.bedrooms !== Number(filters.bedrooms)) return false;
      if (filters.propertyType && l.property_type !== filters.propertyType) return false;
      return true;
    });
  }, [listings, filters]);

  // Sort Logic
  const sortedListings = useMemo(() => {
    return [...filteredListings].sort((a, b) => {
      let va: any, vb: any;
      switch (sort.key) {
        case "price": va = parsePrice(a.price); vb = parsePrice(b.price); break;
        case "bedrooms": va = a.bedrooms ?? 0; vb = b.bedrooms ?? 0; break;
        case "title": va = a.title.toLowerCase(); vb = b.title.toLowerCase(); break;
        case "location": va = a.location.toLowerCase(); vb = b.location.toLowerCase(); break;
        case "property_type": va = a.property_type.toLowerCase(); vb = b.property_type.toLowerCase(); break;
        default: va = a.added_date; vb = b.added_date;
      }
      if (va < vb) return sort.direction === "asc" ? -1 : 1;
      if (va > vb) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredListings, sort]);

  // Pagination Logic
  const totalPages = Math.ceil(sortedListings.length / itemsPerPage) || 1;
  const paginatedListings = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return sortedListings.slice(start, start + itemsPerPage);
  }, [sortedListings, page]);

  // Stats Logic
  const stats = useMemo((): DashboardStats => {
    if (listings.length === 0) {
      return { total: 0, filtered: 0, avgPrice: 0, cheapest: null, mostExpensive: null, topLocations: [], typeBreakdown: [] };
    }

    const prices = listings.map(l => parsePrice(l.price)).filter(p => p > 0);
    const avgPrice = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const dataMinPrice = sortedPrices[0] || 0;
    const dataMaxPrice = sortedPrices[sortedPrices.length - 1] || 1000000;

    const sortedByPrice = [...listings].sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    
    // Type Breakdown
    const types: Record<string, number> = {};
    listings.forEach(l => { types[l.property_type] = (types[l.property_type] || 0) + 1; });
    const typeBreakdown = Object.entries(types).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

    return {
      total: listings.length,
      filtered: filteredListings.length,
      avgPrice,
      cheapest: sortedByPrice[0] || null,
      mostExpensive: sortedByPrice[sortedByPrice.length - 1] || null,
      topLocations: [], // Could implement if needed
      typeBreakdown,
      dataMinPrice,
      dataMaxPrice
    };
  }, [listings, filteredListings]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [filters]);

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSort = (key: SortState["key"]) => {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  return {
    listings: paginatedListings,
    totalFiltered: filteredListings.length,
    loading,
    error,
    filters,
    updateFilter,
    sort,
    toggleSort,
    page,
    setPage,
    totalPages,
    stats,
    propertyTypes: stats.typeBreakdown.map(t => t.name),
  };
}

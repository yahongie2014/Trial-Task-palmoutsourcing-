/** Parse "£179,000" → 179000 */
export function parsePrice(str: string | undefined | null): number {
  if (!str) return 0;
  return Number(str.replace(/[£,\s]/g, "")) || 0;
}

/** Format to display price string */
export function formatPrice(str: string | undefined | null): string {
  if (!str) return "—";
  const n = parsePrice(str);
  if (!n) return str;
  return `£${n.toLocaleString("en-GB")}`;
}

/** Format large numbers to compact form (e.g. 250000 → £250K) */
export function compactPrice(value: number): string {
  if (value >= 1_000_000) return `£${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `£${Math.round(value / 1_000)}K`;
  return `£${value}`;
}

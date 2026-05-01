require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PORT = process.env.PORT || 3000;
const LISTINGS_PATH = path.resolve(__dirname, process.env.LISTINGS_PATH || "../Scrapper/listings.json");
const LISTINGS_URL = process.env.LISTINGS_URL || ""; // optional remote JSON URL

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Load listings from a local file.
 */
function loadFromFile() {
  if (!fs.existsSync(LISTINGS_PATH)) {
    console.error(`❌  listings.json not found at ${LISTINGS_PATH}`);
    console.error("   Run the Python scraper first:  python scraper.py");
    return [];
  }

  try {
    const raw = fs.readFileSync(LISTINGS_PATH, "utf-8").trim();
    if (!raw) {
      console.warn("⚠️  listings.json is empty — scraper may still be running");
      return [];
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`⚠️  Could not parse listings.json: ${err.message}`);
    console.warn("   The scraper may still be writing. Returning empty list.");
    return [];
  }
}

/**
 * Load listings from a remote URL.
 */
async function loadFromUrl(url) {
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : data.data || data.listings || [];
  } catch (err) {
    console.warn(`⚠️  Could not fetch from ${url}: ${err.message}`);
    return [];
  }
}

/**
 * Load listings from the best available source.
 *
 * Priority:
 *   1. ?source=<url> query parameter (per-request override)
 *   2. LISTINGS_URL environment variable (global remote source)
 *   3. Local listings.json file (default)
 */
async function loadListings(sourceOverride) {
  const url = sourceOverride || LISTINGS_URL;
  if (url) return loadFromUrl(url);
  return loadFromFile();
}

/**
 * Parse a price string like "£179,000" into a numeric value (179000).
 * Returns NaN for unparseable strings.
 */
function parsePrice(priceStr) {
  if (!priceStr) return NaN;
  return Number(priceStr.replace(/[£,\s]/g, ""));
}

// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------

const app = express();
app.use(cors());
app.use(express.json());

/**
 * GET /api/listings
 *
 * Query parameters (all optional):
 *   ?source=<url>          — load listings from a remote JSON URL instead of file
 *   ?location=<string>     — case-insensitive substring match on location, title, or postcode
 *   ?min_price=<number>    — minimum price filter (inclusive)
 *   ?max_price=<number>    — maximum price filter (inclusive)
 *   ?bedrooms=<number>     — exact bedroom count filter
 *   ?type=<string>         — case-insensitive substring match on property_type
 *   ?page=<number>         — page number for pagination (default: 1)
 *   ?limit=<number>        — results per page (default: 20, max: 100)
 *
 * Response:
 *   {
 *     "total": <number>,
 *     "page": <number>,
 *     "limit": <number>,
 *     "pages": <number>,
 *     "data": [ ... ]
 *   }
 */
app.get("/api/listings", async (req, res) => {
  let listings = await loadListings(req.query.source);

  // --- Filtering ---

  const { location, min_price, max_price, bedrooms, type } = req.query;

  if (location) {
    const q = location.toLowerCase();
    listings = listings.filter(
      (l) =>
        (l.location || "").toLowerCase().includes(q) ||
        (l.title || "").toLowerCase().includes(q) ||
        (l.postcode || "").toLowerCase().includes(q)
    );
  }

  if (min_price !== undefined) {
    const min = Number(min_price);
    if (!isNaN(min)) {
      listings = listings.filter((l) => {
        const p = parsePrice(l.price);
        return !isNaN(p) && p >= min;
      });
    }
  }

  if (max_price !== undefined) {
    const max = Number(max_price);
    if (!isNaN(max)) {
      listings = listings.filter((l) => {
        const p = parsePrice(l.price);
        return !isNaN(p) && p <= max;
      });
    }
  }

  if (bedrooms !== undefined) {
    const beds = Number(bedrooms);
    if (!isNaN(beds)) {
      listings = listings.filter((l) => l.bedrooms === beds);
    }
  }

  if (type) {
    const t = type.toLowerCase();
    listings = listings.filter((l) =>
      (l.property_type || "").toLowerCase().includes(t)
    );
  }

  // --- Pagination ---

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(10000, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const total = listings.length;
  const pages = Math.ceil(total / limit) || 1;
  const start = (page - 1) * limit;
  const data = listings.slice(start, start + limit);

  res.json({ total, page, limit, pages, data });
});

/**
 * GET /api/listings/:id
 * Fetch a single listing by property_id.
 */
app.get("/api/listings/:id", async (req, res) => {
  const listings = await loadListings(req.query.source);
  const listing = listings.find((l) => l.property_id === req.params.id);

  if (!listing) {
    return res.status(404).json({ error: "Listing not found" });
  }

  res.json(listing);
});

/**
 * GET / — Interactive API reference page.
 * Loads index.html and injects live data via {{PLACEHOLDER}} tokens.
 */
app.get("/", async (_req, res) => {
  const listings = await loadListings();
  const count = listings.length;
  const pages = Math.ceil(count / 20) || 1;

  // Build dynamic "Try it" links for /api/listings/:id
  let listingLinks;
  if (listings.length > 0) {
    listingLinks = listings
      .slice(0, 3)
      .map(
        (l) =>
          `<a href="/api/listings/${l.property_id}">/api/listings/${l.property_id} — ${(l.title || "").substring(0, 45)}…</a>`
      )
      .join("\n        ");
  } else {
    listingLinks = '<a href="/api/listings/87888624">/api/listings/87888624</a>';
  }

  // Read template and inject values
  const template = fs.readFileSync(path.join(__dirname, "index.html"), "utf-8");
  const html = template
    .replace(/\{\{COUNT\}\}/g, String(count))
    .replace(/\{\{PAGES\}\}/g, String(pages))
    .replace(/\{\{LISTING_LINKS\}\}/g, listingLinks);

  res.type("html").send(html);
});

/**
 * GET /health — simple health-check endpoint.
 */
app.get("/health", async (req, res) => {
  const listings = await loadListings(req.query.source);
  const source = req.query.source || LISTINGS_URL || LISTINGS_PATH;
  res.json({ status: "ok", listings_count: listings.length, source });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  const src = LISTINGS_URL || `file: ${LISTINGS_PATH}`;
  console.log(`\n🏠  Property Listings API running on http://localhost:${PORT}`);
  console.log(`   Source: ${src}`);
  console.log(`   GET  /                      — API reference page`);
  console.log(`   GET  /api/listings           — all listings (with filters)`);
  console.log(`   GET  /api/listings/:id       — single listing`);
  console.log(`   GET  /health                — health check`);
  console.log(`\n   Tip: Add ?source=<url> to any endpoint to load from a remote URL\n`);
});

#!/usr/bin/env python3
"""
Lightweight scraper for Edifice Group / RepossessedHousesForSale.com
Extracts property listings from the public archive pages.

Usage:
    python scraper.py                       # scrape page 1 only
    python scraper.py --pages 5             # scrape pages 1-5
    python scraper.py --pages all           # scrape ALL pages (slow!)
    python scraper.py --output results.csv  # save to CSV
    python scraper.py --output results.json # save to JSON
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
import re
import sys
import time
from dataclasses import asdict, dataclass, fields
from pathlib import Path
from typing import Iterator
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup, Tag

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

BASE_URL = "https://repossessedhousesforsale.com/properties/"
REQUEST_DELAY = 1.5
REQUEST_TIMEOUT = 15
MAX_RETRIES = 3 

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-GB,en;q=0.9",
}

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("scraper")

# ---------------------------------------------------------------------------
# Data model
# ---------------------------------------------------------------------------

@dataclass
class Property:
    """Single property listing."""
    title: str
    price: str
    location: str
    link: str
    property_id: str
    bedrooms: int | None
    property_type: str
    postcode: str
    image_url: str
    added_date: str

# ---------------------------------------------------------------------------
# Parsing helpers
# ---------------------------------------------------------------------------

_BEDROOM_RE = re.compile(r"(\d+)\s*bedroom", re.IGNORECASE)
_POSTCODE_RE = re.compile(r"[A-Z]{1,2}\d[A-Z\d]?\s*\d?[A-Z]{0,2}", re.IGNORECASE)
_PROPERTY_ID_RE = re.compile(r"/properties/(\d+)")

# Common property type keywords (order matters – longest/first match wins)
_PROPERTY_TYPES = [
    "end of terrace house", "semi-detached house", "detached house",
    "terraced house", "flat", "apartment", "bungalow",
    "maisonette", "cottage", "studio", "land", "house",
]


def _extract_bedrooms(title: str) -> int | None:
    m = _BEDROOM_RE.search(title)
    return int(m.group(1)) if m else None


def _extract_property_type(title: str) -> str:
    title_lower = title.lower()
    for pt in _PROPERTY_TYPES:
        if pt in title_lower:
            return pt.title()
    return "Unknown"


def _extract_postcode(title: str) -> str:
    matches = _POSTCODE_RE.findall(title)
    return matches[-1].strip() if matches else ""


def _extract_property_id(url: str) -> str:
    m = _PROPERTY_ID_RE.search(url)
    return m.group(1) if m else ""


def _parse_card(card: Tag) -> Property | None:
    """
    Parse a single property card (div[itemtype="https://schema.org/House"])
    into a Property dataclass.
    """

    # --- Title & Link ---
    title_el = card.select_one("a.archive-properties-title-link")
    if not title_el:
        return None

    title = title_el.get_text(strip=True)
    link = urljoin(BASE_URL, title_el.get("href", ""))

    # --- Price (itemprop="value") ---
    price_el = card.select_one('[itemprop="value"]')
    if price_el:
        raw_price = price_el.get_text(strip=True)
        # Normalise: ensure £ prefix
        price = raw_price if raw_price.startswith("£") else f"£{raw_price}"
    else:
        price = ""

    # --- Location (itemprop="address") ---
    location_el = card.select_one('[itemprop="address"]')
    location = location_el.get_text(strip=True) if location_el else ""

    # --- Image (itemprop="image") ---
    img_el = card.select_one('img[itemprop="image"]')
    image_url = ""
    if img_el:
        src = img_el.get("data-src") or img_el.get("src", "")
        if src and not src.startswith("data:"):
            image_url = urljoin(BASE_URL, src)

    # --- Added date ---
    added_date = ""
    # The date lives in a right-aligned div containing "Added on ..."
    for div in card.find_all("div"):
        text = div.get_text(strip=True)
        if text.startswith("Added on"):
            added_date = text.replace("Added on", "").strip()
            break

    return Property(
        title=title,
        price=price,
        location=location,
        link=link,
        property_id=_extract_property_id(link),
        bedrooms=_extract_bedrooms(title),
        property_type=_extract_property_type(title),
        postcode=_extract_postcode(title),
        image_url=image_url,
        added_date=added_date,
    )

# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------

def _fetch_page(session: requests.Session, page_num: int) -> str:
    """Fetch a single archive page, with retries."""
    url = BASE_URL if page_num <= 1 else f"{BASE_URL}?pg={page_num}"

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = session.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
            resp.raise_for_status()
            return resp.text
        except requests.RequestException as exc:
            log.warning("Attempt %d/%d failed for page %d: %s", attempt, MAX_RETRIES, page_num, exc)
            if attempt < MAX_RETRIES:
                time.sleep(2 ** attempt)
            else:
                raise

    return ""  # unreachable but keeps type-checkers happy


def _detect_last_page(soup: BeautifulSoup) -> int:
    """Detect the total number of archive pages from the pagination links."""
    max_page = 1
    for link in soup.select("a.page-numbers"):
        href = link.get("href", "")
        m = re.search(r"[?&]pg=(\d+)", href)
        if m:
            max_page = max(max_page, int(m.group(1)))
        text = link.get_text(strip=True)
        if text.isdigit():
            max_page = max(max_page, int(text))
    return max_page

# ---------------------------------------------------------------------------
# Core scraping logic
# ---------------------------------------------------------------------------

def scrape_page(session: requests.Session, page_num: int) -> tuple[list[Property], int]:
    """
    Scrape a single page of listings.
    Returns (properties, last_page_number).
    """
    html = _fetch_page(session, page_num)
    soup = BeautifulSoup(html, "lxml")

    last_page = _detect_last_page(soup)

    # Each property card is a div with Schema.org House itemtype
    cards = soup.select('div[itemtype="https://schema.org/House"]')

    properties: list[Property] = []
    seen_ids: set[str] = set()

    for card in cards:
        prop = _parse_card(card)
        if prop and prop.property_id not in seen_ids:
            seen_ids.add(prop.property_id)
            properties.append(prop)

    return properties, last_page


def scrape(max_pages: int | None = None) -> Iterator[Property]:
    """
    Generator that yields Property objects across all requested pages.
    If max_pages is None, scrape all available pages.
    Deduplicates across pages by property_id.
    """
    session = requests.Session()
    seen_ids: set[str] = set()

    log.info("Fetching page 1 to detect pagination …")
    first_batch, last_page = scrape_page(session, 1)
    for prop in first_batch:
        if prop.property_id not in seen_ids:
            seen_ids.add(prop.property_id)
            yield prop

    end_page = last_page if max_pages is None else min(max_pages, last_page)
    log.info("Total pages detected: %d — will scrape up to page %d", last_page, end_page)

    for page_num in range(2, end_page + 1):
        time.sleep(REQUEST_DELAY)
        log.info("Scraping page %d / %d …", page_num, end_page)
        batch, _ = scrape_page(session, page_num)
        for prop in batch:
            if prop.property_id not in seen_ids:
                seen_ids.add(prop.property_id)
                yield prop

# ---------------------------------------------------------------------------
# Output helpers
# ---------------------------------------------------------------------------

def save_csv(properties: list[Property], path: Path) -> None:
    fieldnames = [f.name for f in fields(Property)]
    with open(path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        for p in properties:
            writer.writerow(asdict(p))
    log.info("Saved %d listings → %s", len(properties), path)


def save_json(properties: list[Property], path: Path) -> None:
    data = [asdict(p) for p in properties]
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(data, fh, indent=2, ensure_ascii=False)
    log.info("Saved %d listings → %s", len(properties), path)

# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Scrape property listings from RepossessedHousesForSale.com",
    )
    parser.add_argument(
        "--pages",
        default="1",
        help="Number of pages to scrape, or 'all' for everything (default: 1)",
    )
    parser.add_argument(
        "--output", "-o",
        default="listings.json",
        help="Output file path (.json or .csv) (default: listings.json)",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable debug logging",
    )
    args = parser.parse_args()

    if args.verbose:
        log.setLevel(logging.DEBUG)

    max_pages: int | None
    if args.pages.lower() == "all":
        max_pages = None
    else:
        max_pages = int(args.pages)
        if max_pages < 1:
            parser.error("--pages must be >= 1")

    output_path = Path(args.output)
    results: list[Property] = list(scrape(max_pages))

    if not results:
        log.warning("No listings found. The site structure may have changed.")
        sys.exit(1)

    log.info("Scraped %d total listings", len(results))

    # Quick preview
    for p in results[:3]:
        log.info("  → %s  |  %s  |  %s  |  %s", p.property_id, p.price, p.location, p.title[:50])
    if len(results) > 3:
        log.info("  … and %d more", len(results) - 3)

    # Save output
    suffix = output_path.suffix.lower()
    if suffix == ".csv":
        save_csv(results, output_path)
    else:
        save_json(results, output_path)


if __name__ == "__main__":
    main()

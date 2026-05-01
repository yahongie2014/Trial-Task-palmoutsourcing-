# Property Listings Scraper & API

A two-part system for collecting and serving repossessed property listings from [RepossessedHousesForSale.com](https://repossessedhousesforsale.com/properties/).

---

## Project Structure

```
PlameTask/
├── scraper.py          # Python web scraper (Step 1)
├── requirements.txt    # Python dependencies
├── listings.json       # Scraped data (auto-generated)
├── venv/               # Python virtual environment
└── api/
    ├── server.js       # Express API microservice (Step 2)
    └── package.json
```

---

## Step 1: Python Web Scraper

### Setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Usage

```bash
# Scrape page 1 (10 listings)
python scraper.py

# Scrape first 5 pages
python scraper.py --pages 5

# Scrape ALL pages (~648 pages, ~6,400 listings)
python scraper.py --pages all

# Output as CSV
python scraper.py --pages 3 --output listings.csv
```

### Data Fields

| Field           | Example                                  |
|-----------------|------------------------------------------|
| `title`         | 3 bedroom semi-detached house for sale… |
| `price`         | £179,000                                 |
| `location`      | DN37                                     |
| `link`          | https://repossessedhousesforsale.com/…   |
| `property_id`   | 87888624                                 |
| `bedrooms`      | 3                                        |
| `property_type` | Semi-Detached House                      |
| `postcode`      | DN37                                     |
| `image_url`     | (when available)                         |
| `added_date`    | 30 Apr, 2026                             |

---

## Step 2: Node.js API Microservice

### Setup

```bash
cd api
npm install
```

### Start

```bash
node server.js
# 🏠  Property Listings API running on http://localhost:3000
```

### Endpoints

#### `GET /api/listings`

Returns paginated listings with optional filters.

**Query Parameters:**

| Param       | Type   | Description                                    |
|-------------|--------|------------------------------------------------|
| `location`  | string | Substring search on location, title, postcode  |
| `min_price` | number | Minimum price (inclusive)                       |
| `max_price` | number | Maximum price (inclusive)                       |
| `bedrooms`  | number | Exact bedroom count                            |
| `type`      | string | Substring match on property type (e.g. "flat") |
| `page`      | number | Page number (default: 1)                       |
| `limit`     | number | Results per page (default: 20, max: 100)       |

**Examples:**

```bash
# All listings
curl http://localhost:3000/api/listings

# Filter by location
curl "http://localhost:3000/api/listings?location=bristol"

# Filter by price range
curl "http://localhost:3000/api/listings?min_price=100000&max_price=250000"

# Filter by bedrooms + type
curl "http://localhost:3000/api/listings?bedrooms=2&type=flat"

# Paginate
curl "http://localhost:3000/api/listings?page=2&limit=5"
```

**Response:**

```json
{
  "total": 16,
  "page": 1,
  "limit": 20,
  "pages": 1,
  "data": [
    {
      "title": "3 bedroom semi-detached house for sale in …",
      "price": "£179,000",
      "location": "DN37",
      "link": "https://repossessedhousesforsale.com/properties/87888624",
      "property_id": "87888624",
      "bedrooms": 3,
      "property_type": "Semi-Detached House",
      "postcode": "DN37",
      "image_url": "",
      "added_date": "30 Apr, 2026"
    }
  ]
}
```

#### `GET /api/listings/:id`

Returns a single listing by property ID.

#### `GET /health`

Health check — returns `{ "status": "ok", "listings_count": 16 }`.

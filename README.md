# Hidden Deals — Property Listings Dashboard

**Task Reference:** [Full-Stack Web Developer Trial Task](https://palmoutsourcing.notion.site/Full-Stack-Web-Developer-Trial-Task-33e8b7b2f0ca809bb741e6d6c555eaa1#33e8b7b2f0ca809a8624cb26aeb28a04)

---

A full-stack system designed to scrape, serve, and visualize repossessed and undervalued property deals within a WordPress administrative interface.

---

## 🌐 Live Environment

| Component | URL |
| :--- | :--- |
| **Production API** | [https://listing.sericap.online/](https://listing.sericap.online/) |
| **WP Dashboard** | [https://wp.sericap.online/wp-admin/...](https://wp.sericap.online/wp-admin/admin.php?page=hidden-deals) |

**Admin Credentials:**
- **User:** `palm`
- **Password:** `Palm2020!@100`

---

## 🏗️ Architecture Overview

The system consists of three main decoupled layers:

1.  **Data Layer (Scrapper)**: Python-based pipeline that extracts property data from RepossessedHousesForSale.com.
2.  **Service Layer (API)**: Node.js/Express microservice that serves the listings with advanced filtering.
3.  **UI Layer (Dashboard)**: A premium React dashboard built with TypeScript and Tailwind CSS, embedded as a WordPress Plugin.

---

## 📁 Project Structure

```bash
.
├── Scrapper/           # Python Web Scraper (Step 1)
│   ├── scraper.py      # Core scraping logic
│   ├── gui.py          # Desktop GUI (Tkinter)
│   ├── web_gui.py      # Flask Web Interface
│   ├── scraper-ui.html # Web UI template
│   ├── requirements.txt# Python dependencies
│   └── listings.json   # Scraped data output
├── api/                # Node.js Express API Service (Step 2)
│   ├── server.js       # API entry point & logic
│   ├── index.html      # Interactive API reference page
│   ├── .env            # API configuration
│   ├── package.json    # Node dependencies
│   └── listings.json   # Local data source (201 records)
├── dashboard/          # React + Tailwind Dashboard (Step 3)
│   ├── src/            # Components, Hooks, and Types
│   ├── public/         # Static assets
│   ├── .env            # Frontend environment variables
│   ├── tailwind.config.js # Styling configuration
│   └── vite.config.ts  # Build configuration
└── wp-plugin/          # WordPress Plugin Wrapper
    └── hidden-deals/   # Plugin distribution folder
        ├── build/      # Production-ready React assets
        └── hidden-deals.php # WordPress entry point & menu logic
```

---

## 🐍 Step 1: Python Web Scraper

### Setup
```bash
cd Scrapper
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

### 📊 Data Fields
The scraper extracts the following fields for each property:

| Field | Example |
| :--- | :--- |
| `title` | 3 bedroom semi-detached house for sale... |
| `price` | £179,000 |
| `location` | DN37 |
| `link` | https://repossessedhousesforsale.com/... |
| `property_id` | 87888624 |
| `bedrooms` | 3 |
| `property_type` | Semi-Detached House |
| `postcode` | DN37 |
| `image_url` | (URL to property image) |
| `added_date` | 30 Apr, 2026 |

### 🖥️ Desktop GUI (Visual Mode)
For a more user-friendly experience, you can use the built-in desktop application:
```bash
python gui.py
```
**GUI Features:**
- **Flexible Paging**: Select specific page ranges (1, 5, 10, etc.) or toggle "Scrape ALL".
- **Format Toggle**: Instantly switch between **JSON** and **CSV** exports.
- **Activity Log**: Watch the scraping progress in real-time.
- **Save Dialog**: Choose your destination folder and filename visually.

### 🕸️ Web UI (Browser Mode)
Alternatively, you can run a local web server to manage scraping from your browser:
```bash
# Set up venv and run
python3 -m venv venv
source venv/bin/activate
pip install flask
python web_gui.py
```
*Access the interface at `http://localhost:5001`*

**Web Features:**
- **Remote Access**: Manage scraping from any device in your network.
- **SSE Streaming**: Live log updates directly in the browser.
- **Easy Download**: Instantly download results after the job completes.

---

## ⚙️ Step 2: Node.js API Microservice

### Setup & Start
```bash
cd api
npm install
node server.js
```
*API will be live at `http://localhost:3000`*

### Endpoints

#### `GET /api/listings`
Returns paginated listings with filtering.

**Query Parameters:**

| Param | Type | Description |
| :--- | :--- | :--- |
| `location` | string | Substring search on location, title, or postcode |
| `min_price` | number | Minimum price (inclusive) |
| `max_price` | number | Maximum price (inclusive) |
| `bedrooms` | number | Exact bedroom count |
| `type` | string | Substring match on property type (e.g. "flat") |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 20, max: 10,000) |
| `source` | string | Optional remote JSON URL to load data from |

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

#### `GET /api/listings/:id`
Returns a single listing by property ID.

#### `GET /health`
Health check showing record count and data source.
```json
{ "status": "ok", "listings_count": 201, "source": "..." }
```

---

## 🎨 Step 3: React Dashboard & WP Plugin

### Development
```bash
cd dashboard
npm install
npm run dev
```

### Production Build
To update the WordPress plugin with the latest UI changes:
```bash
cd dashboard
npm run build
```
This moves the bundle into `wp-plugin/hidden-deals/build/`.

### WordPress Installation
1.  Compress the `wp-plugin/hidden-deals` folder.
2.  Upload it to your WordPress site via **Plugins > Add New**.
3.  Activate **Hidden Deals Dashboard**.
4.  Navigate to the **Hidden Deals** menu in your WP sidebar.

---

## ✨ Features
- **Premium Dark UI**: Built with Tailwind CSS and TypeScript.
- **Dynamic Price Slider**: Automatic bounds based on data range (£19K - £1.3M).
- **Real-time Stats**: Live calculation of averages and prime properties.
- **Robust Mounting**: Handles WordPress admin lifecycle with `DOMContentLoaded` checks.
- **Env Config**: Fully configurable paths and endpoints via `.env` files.

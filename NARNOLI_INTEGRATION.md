# Narnoli Corporation Integration - Enhanced Web Scraping

This document explains the comprehensive web scraping integration with Narnoli Corporation (narnolicorporation.in) for fetching live metal rates using multiple scraping approaches including a **Beautiful Soup-like TypeScript library**.

## 🚀 Enhanced Features

The system now features a robust, production-ready web scraping architecture with multiple scraping engines:

1. **Beautiful Soup TypeScript** - Advanced HTML parsing with Python Beautiful Soup-like syntax
2. **Enhanced Scraper** - Intelligent table analysis and heuristic-based rate extraction
3. **Legacy Scraper** - Original implementation for comparison and fallback
4. **Comprehensive Debug Tools** - Multiple test panels and diagnostic utilities

## 🍲 Beautiful Soup TypeScript Library

### Overview

The Beautiful Soup TypeScript library (`beautifulSoupTS.ts`) provides Python's Beautiful Soup functionality in TypeScript with additional features for financial data extraction.

### Core Features

#### Element Selection (Beautiful Soup-like)

```typescript
import { BeautifulSoupTS } from "@/services/beautifulSoupTS";

const soup = new BeautifulSoupTS(html);

// Find elements
const table = soup.find("table.rates");
const allTables = soup.findAll("table");
const rateElements = soup.findByText("gold", false);

// CSS selectors
const elements = soup.select("tr td");
const firstElement = soup.selectOne(".price");
```

#### Financial Data Extraction

```typescript
// Extract financial data from elements
const numbers = element.extractNumbers(); // [75450, 99.5, 250]
const prices = element.extractPrices(); // [75450.00, 250.00]
const percentages = element.extractPercentages(); // [2.5, -1.2]

// Table-specific methods
const cells = element.findTableCells();
const position = element.getTablePosition(); // {row: 2, col: 1}
```

#### Advanced Parsing Methods

```typescript
// Navigation
const parent = element.findParent("table");
const nextSibling = element.findNextSibling("td");
const previousSibling = element.findPreviousSibling();

// Text extraction
const text = element.getText(" "); // Join with space
const hasClass = element.hasClass("rate-cell");
const attribute = element.getAttribute("data-rate");
```

### Financial Rate Detection

The library includes intelligent pattern matching for financial data:

```typescript
// Rate type identification
const ratePatterns = {
  gold: ["gold", "सोना", "99.5", "99.50", "auction"],
  silver: ["silver", "चांदी", "999", "925"],
  spot: ["spot", "तत्काल", "current"],
  rates: ["rate", "दर", "price", "मूल्य", "bid", "ask", "sell"],
};

// Automatic rate extraction
const rates = await beautifulSoupService.scrapeNarnoliRates();
```

## 📊 Service Architecture

### 1. Beautiful Soup Service (`beautifulSoupTS.ts`)

**Primary Features:**

- Beautiful Soup-like HTML parsing
- Advanced financial data extraction
- Multi-proxy CORS handling
- Intelligent rate detection
- Comprehensive error handling

**Usage:**

```typescript
import { beautifulSoupService } from "@/services/beautifulSoupTS";

// Fresh scraping
const result = await beautifulSoupService.scrapeNarnoliRates();

// With caching
const cachedResult = await beautifulSoupService.scrapeWithCache();

// Testing
await beautifulSoupService.testScraping();
```

### 2. Enhanced Scraper (`enhancedNarnoliScraper.ts`)

**Features:**

- Beautiful Soup-like element detection
- Advanced table structure analysis
- Multiple selector strategies
- Detailed debugging information

### 3. Legacy Service (`narnolicorporationService.ts`)

**Features:**

- Original scraping implementation
- Fallback functionality
- Basic HTML parsing
- CORS proxy support

## Overview

The system now fetches real-time metal rates from Narnoli Corporation, which provides comprehensive gold and silver pricing data including:

- **Gold Auction Rates** - Live auction prices with GST details
- **Market Rates** - Current bid/ask/high/low prices for various metals
- **Spot Rates** - Spot pricing for gold, silver, and INR

## Features

### 🔄 Automatic Data Fetching

- Real-time data fetching from narnolicorporation.in
- CORS proxy support for browser-based requests
- Intelligent caching (5-minute cache duration)
- Fallback to cached data when live fetch fails

### 📊 Data Structure

The system processes three types of rates:

#### Gold Auction Rates

```typescript
interface GoldAuctionRate {
  id: string;
  product: string; // e.g., "GOLD AUCTION 99.50 GST EXTRA MINIMUM 100 GM"
  gst: string; // GST rate
  extraMinimum: string; // Minimum quantity
  mRate: number; // Market rate
  premium: number; // Premium amount
  sell: number; // Selling price
  lastUpdated: string;
}
```

#### Market Rates

```typescript
interface MetalRate {
  id: string;
  product: string; // e.g., "GOLD CURRENT", "SILVER 999"
  category: string; // Categorized type
  bid?: number; // Bid price
  ask?: number; // Ask price
  high?: number; // Day's high
  low?: number; // Day's low
  lastUpdated: string;
  source: "narnoli";
}
```

#### Spot Rates

```typescript
interface SpotRate {
  id: string;
  product: string; // e.g., "GOLD SPOT", "SILVER SPOT"
  bid: number; // Bid price
  ask: number; // Ask price
  high: number; // Day's high
  low: number; // Day's low
  lastUpdated: string;
}
```

### 🎨 UI Components

#### NarnoliRatesDisplay

Full-featured component showing all Narnoli Corporation rates:

- Tabular display of all rate types
- Color-coded columns for easy reading
- Refresh functionality
- Error handling and status display
- Responsive design

#### QuickRatesWidget

Dashboard widget showing key rates:

- Compact view of 4 most important rates
- Auto-refresh every 5 minutes
- Click-to-refresh functionality
- Direct link to full rates page

### 📡 API Integration

#### NarnoliCorporationService

Main service class handling all Narnoli Corporation interactions:

```typescript
// Fetch live rates
const liveRates = await narnoliCorporationService.fetchLiveRates();

// Get rates with caching
const cachedRates = await narnoliCorporationService.getRatesWithCache();

// Check cached data
const cached = narnoliCorporationService.getCachedRates();
```

#### MetalRatesService Integration

Enhanced to include Narnoli data:

- Primary data source: Narnoli Corporation
- Fallback: Jaipur Sarafa API (when available)
- Final fallback: Mock data
- Returns both processed rates and raw Narnoli data

### 🔧 Technical Implementation

#### CORS Handling

Since the Narnoli Corporation website doesn't provide CORS headers, we use a CORS proxy:

```typescript
const CORS_PROXY = "https://api.allorigins.win/raw?url=";
const response = await fetch(`${CORS_PROXY}${encodeURIComponent(BASE_URL)}`);
```

#### HTML Parsing

The service parses HTML tables from the website:

- Uses DOMParser to parse HTML content
- Extracts data from table structures
- Handles various table formats and layouts
- Robust error handling for parsing failures

#### Data Categorization

Intelligent categorization of products:

- Gold products: `gold_995`, `gold_auction`, `gold_current`
- Silver products: `silver_999`, `silver_current`
- Spot products: `gold_spot`, `silver_spot`, `inr_spot`

#### Caching Strategy

- 5-minute cache duration for optimal performance
- localStorage-based caching
- Automatic cache invalidation
- Graceful fallback to cached data

### 🚀 Usage Examples

#### Dashboard Integration

```tsx
import { QuickRatesWidget } from "@/components/QuickRatesWidget";

function Dashboard() {
  return (
    <div>
      {/* Other dashboard content */}
      <QuickRatesWidget />
    </div>
  );
}
```

#### Rates Page Integration

```tsx
import { NarnoliRatesDisplay } from "@/components/NarnoliRatesDisplay";

function RatesPage() {
  return (
    <div>
      {/* Other rates content */}
      <NarnoliRatesDisplay />
    </div>
  );
}
```

#### Direct Service Usage

```typescript
import { narnoliCorporationService } from "@/services/narnolicorporationService";

async function getGoldRate() {
  const rates = await narnoliCorporationService.getRatesWithCache();

  if (rates.status === "success") {
    const goldRate = rates.marketRates.find((r) =>
      r.product.toLowerCase().includes("gold current")
    );
    return goldRate?.ask || goldRate?.bid;
  }

  return null;
}
```

### 🛠️ Configuration

#### Environment Variables

No environment variables required - the service works out of the box.

#### Customization Options

```typescript
// Adjust cache duration
private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Change CORS proxy (if needed)
private readonly CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// Modify parsing logic for different table structures
private parseRatesFromHTML(html: string): NarnoliRatesData {
  // Custom parsing implementation
}
```

### 🔍 Debugging

#### Test Script

Use the included test script to verify functionality:

```typescript
import { testNarnoliService } from "@/utils/testNarnoli";

// Run in browser console
testNarnoliService().then((result) => {
  console.log("Test result:", result);
});
```

#### Browser Console

Monitor network requests and service behavior:

```javascript
// Check cached data
const cached = localStorage.getItem("narnoli_rates");
console.log("Cached rates:", JSON.parse(cached));

// Force refresh
narnoliCorporationService.fetchLiveRates().then(console.log);
```

### 🚨 Error Handling

The system includes comprehensive error handling:

- Network request failures
- HTML parsing errors
- Invalid data formats
- CORS proxy issues
- Cache corruption

All errors are logged and graceful fallbacks are provided.

### 📱 Mobile Responsiveness

All UI components are fully responsive:

- Tables scroll horizontally on mobile
- Compact widget layout for small screens
- Touch-friendly buttons and interactions
- Optimized typography for readability

### 🔄 Future Enhancements

Planned improvements:

- WebSocket support for real-time updates
- Historical rate tracking and charts
- Rate change notifications
- Multiple data source aggregation
- Advanced filtering and search
- Export functionality for rate data

## Data Flow Diagram

```
Narnoli Corporation Website
         ↓
    CORS Proxy (allorigins.win)
         ↓
    HTML Content Fetch
         ↓
    DOM Parser & Data Extraction
         ↓
    Data Categorization & Validation
         ↓
    localStorage Cache (5 min TTL)
         ↓
    UI Components (Dashboard & Rates Page)
```

This integration provides a robust, real-time metal rates system that enhances the jewelry shop's pricing accuracy and customer service capabilities.

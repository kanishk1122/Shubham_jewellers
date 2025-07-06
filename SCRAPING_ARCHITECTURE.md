# Enhanced Web Scraping Architecture for Narnoli Corporation

## Overview

This document provides a comprehensive guide to the robust, production-ready web scraping system implemented for fetching live metal rates from Narnoli Corporation (narnolicorporation.in). The system uses a **Beautiful Soup-like approach in TypeScript** for reliable data extraction and processing.

## Architecture Components

### 1. Core Scraping Service (`enhancedNarnoliScraper.ts`)

#### Beautiful Soup-like Features

- **HTML Parsing**: Uses `DOMParser` for robust HTML parsing
- **Element Selection**: Multiple CSS selectors with fallback strategies
- **Text Extraction**: Advanced number extraction with regex patterns
- **Attribute Handling**: Complete element attribute inspection
- **Table Analysis**: Intelligent table structure detection and processing

#### Key Classes

```typescript
class EnhancedWebScraper {
  // Beautiful Soup-like HTML parsing
  private parseHTML(html: string): Document;

  // Element finding with multiple criteria
  private findElements(
    doc: Document,
    criteria: {
      tag?: string;
      className?: string;
      text?: string;
      attributes?: { [key: string]: string };
    }
  ): Element[];

  // Advanced table extraction
  private extractTables(doc: Document): TableData[];

  // Number extraction from text
  private extractNumbers(text: string): number[];
}
```

### 2. Legacy Service (`narnolicorporationService.ts`)

- Original implementation for comparison
- CORS proxy handling
- Basic HTML parsing
- Fallback functionality

### 3. Data Interfaces

#### Core Data Types

```typescript
interface ScrapedData {
  tables: TableData[];
  rawHTML: string;
  metadata: {
    title: string;
    url: string;
    timestamp: string;
    tableCount: number;
    rowCount: number;
  };
}

interface TableData {
  id: string;
  headers: string[];
  rows: RowData[];
  className?: string;
  attributes?: { [key: string]: string };
}

interface RowData {
  cells: CellData[];
  index: number;
  className?: string;
}

interface CellData {
  text: string;
  html: string;
  className?: string;
  attributes?: { [key: string]: string };
  numbers: number[];
}
```

#### Rate Data Types

```typescript
interface GoldAuctionRate {
  id: string;
  product: string;
  gst: string;
  extraMinimum: string;
  mRate: number;
  premium: number;
  sell: number;
  lastUpdated: string;
}

interface MetalRate {
  id: string;
  product: string;
  category: string;
  mRate?: number;
  premium?: number;
  sell?: number;
  bid?: number;
  ask?: number;
  high?: number;
  low?: number;
  lastUpdated: string;
  source: "narnoli" | "manual";
}

interface SpotRate {
  id: string;
  product: string;
  bid: number;
  ask: number;
  high: number;
  low: number;
  lastUpdated: string;
}
```

## Intelligent Rate Detection

### 1. Gold Auction Rate Detection

```typescript
private isGoldAuctionRow(productText: string, row: RowData): boolean {
  const keywords = ["gold", "auction", "99.50", "gst", "extra", "minimum"];
  const keywordCount = keywords.filter(keyword => productText.includes(keyword)).length;

  return productText.includes("gold") && keywordCount >= 2 &&
         row.cells.some(cell => cell.numbers.length > 0);
}
```

### 2. Market Rate Detection

```typescript
private isMarketRateRow(productText: string, row: RowData): boolean {
  const isGoldOrSilver = productText.includes("gold") || productText.includes("silver");
  const isNotAuctionOrSpot = !productText.includes("auction") && !productText.includes("spot");
  const hasNumbers = row.cells.some(cell => cell.numbers.length > 0);
  const hasMarketTerms = productText.includes("current") || productText.includes("999") ||
                        productText.includes("925") || /\d{2,}/.test(productText);

  return isGoldOrSilver && isNotAuctionOrSpot && hasNumbers && hasMarketTerms;
}
```

### 3. Spot Rate Detection

```typescript
private isSpotRateRow(productText: string, row: RowData): boolean {
  return productText.includes("spot") && row.cells.some(cell => cell.numbers.length > 0);
}
```

## Advanced Number Extraction and Heuristics

### Number Sorting and Assignment

```typescript
// For Gold Auction Rates
const sortedNumbers = [...allNumbers].sort((a, b) => b - a);
const sell = sortedNumbers[0]; // Largest = sell price
const mRate = sortedNumbers[1]; // Second largest = market rate
const premium = sortedNumbers[sortedNumbers.length - 1]; // Smallest = premium

// For Market Rates
const numbers = [...allNumbers].sort((a, b) => a - b); // Ascending
if (numbers.length >= 4) {
  low = numbers[0];
  bid = numbers[1];
  ask = numbers[2];
  high = numbers[numbers.length - 1];
}
```

## CORS Proxy Management

### Multiple Proxy Fallback

```typescript
private corsProxies = [
  "https://api.allorigins.win/raw?url=",
  "https://corsproxy.io/?",
  "https://cors-anywhere.herokuapp.com/",
];
```

The system automatically tries each proxy until one succeeds, ensuring maximum reliability.

## Caching and Performance

### Intelligent Caching

- **Cache Duration**: 5 minutes for rate data
- **Cache Keys**: Separate for enhanced vs legacy services
- **Cache Invalidation**: Automatic based on timestamp
- **Error Handling**: Graceful fallback on cache failures

```typescript
async getRatesWithCache(): Promise<NarnoliScrapedRates> {
  const cached = this.getCachedRates();
  if (cached) {
    console.log("📦 Using cached rates");
    return cached;
  }

  console.log("🔄 Fetching fresh rates");
  const freshData = await this.fetchLiveRates();

  if (freshData.status === "success") {
    this.cacheRates(freshData);
  }

  return freshData;
}
```

## Debug and Testing Tools

### 1. Enhanced Scraping Test Panel (`EnhancedScrapingTestPanel.tsx`)

**Features:**

- Real-time scraping execution
- Debug data download
- Visual status indicators
- Table structure analysis
- Rate extraction metrics

**Usage:**

```tsx
<EnhancedScrapingTestPanel />
```

### 2. Narnoli Debug Panel (`NarnoliDebugPanel.tsx`)

**Features:**

- Legacy service debugging
- Comparative analysis
- Debug report generation
- Error diagnostics

**Usage:**

```tsx
<NarnoliDebugPanel />
```

### 3. Test Utilities (`testNarnoli.ts`)

**Features:**

- Programmatic testing
- Service comparison
- Cache validation
- Performance metrics

## Error Handling and Resilience

### Multi-Level Error Handling

1. **Network Level**: CORS proxy fallback
2. **Parsing Level**: Multiple selector strategies
3. **Data Level**: Intelligent heuristics and fallbacks
4. **Cache Level**: Graceful degradation

### Example Error Response

```typescript
{
  goldAuctionRates: [],
  marketRates: [],
  spotRates: [],
  lastFetched: "2024-01-15T10:30:00.000Z",
  status: "error",
  message: "All CORS proxies failed"
}
```

## Integration Points

### 1. Dashboard Integration

```typescript
import { enhancedNarnoliService } from "@/services/enhancedNarnoliScraper";

const rates = await enhancedNarnoliService.getRatesWithCache();
```

### 2. Metal Rates Manager Integration

```typescript
import { metalRatesService } from "@/services/metalRatesService";

// Automatically uses enhanced scraper as primary source
const rates = await metalRatesService.fetchLiveRates();
```

### 3. Widget Integration

```typescript
// Real-time rate display widgets
<LiveMetalRatesWidget />
<QuickRatesWidget />
<NarnoliRatesDisplay />
```

## Performance Optimizations

### 1. Selective Parsing

- Only parse relevant table sections
- Skip empty or irrelevant rows
- Early exit on successful matches

### 2. Memory Management

- Limit raw HTML storage (5000 chars)
- Efficient data structures
- Garbage collection friendly

### 3. Network Optimizations

- Concurrent proxy attempts
- Request timeouts
- Connection pooling

## Security Considerations

### 1. Input Sanitization

- HTML parsing through DOMParser
- XSS prevention
- Content validation

### 2. CORS Handling

- Trusted proxy services only
- URL encoding for security
- Request validation

### 3. Data Validation

- Number format validation
- Required field checks
- Range validation for rates

## Monitoring and Logging

### Comprehensive Logging

```typescript
console.log("🕷️ Starting enhanced web scraping...");
console.log("📡 Trying proxy:", proxy);
console.log("✅ Successfully fetched HTML");
console.log("📊 Scraped N tables with M rows");
console.log("✅ Extracted: X gold auction, Y market, Z spot rates");
```

### Debug Information

- Request/response timing
- Parser performance metrics
- Success/failure rates
- Data quality metrics

## Best Practices

### 1. Development

- Use TypeScript for type safety
- Implement comprehensive error handling
- Write unit tests for critical functions
- Use ESLint and Prettier for code quality

### 2. Testing

- Test with real network conditions
- Validate against known data samples
- Performance testing under load
- Cross-browser compatibility

### 3. Deployment

- Environment-specific configurations
- Monitoring and alerting
- Gradual rollout strategies
- Rollback procedures

## Future Enhancements

### Potential Improvements

1. **Machine Learning**: Pattern recognition for new rate formats
2. **Real-time Updates**: WebSocket connections for live data
3. **Multiple Sources**: Additional metal rate providers
4. **Historical Data**: Rate trend analysis and storage
5. **API Endpoints**: RESTful API for external consumption

### Scalability Considerations

1. **Server-side Scraping**: Move scraping to backend for better reliability
2. **Distributed Caching**: Redis or similar for multi-instance deployments
3. **Rate Limiting**: Respect source website's rate limits
4. **Load Balancing**: Multiple scraping instances for high availability

## Conclusion

This implementation provides a robust, Beautiful Soup-like web scraping solution in TypeScript that:

- ✅ Handles complex HTML structures reliably
- ✅ Provides intelligent rate detection and extraction
- ✅ Includes comprehensive error handling and fallbacks
- ✅ Offers extensive debugging and testing tools
- ✅ Integrates seamlessly with the existing application
- ✅ Maintains high performance and security standards

The system is production-ready and includes all necessary tools for monitoring, debugging, and maintaining the scraping functionality.

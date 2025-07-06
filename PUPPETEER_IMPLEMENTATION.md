# Puppeteer Integration for Narnoli Corporation Scraping

## Overview

This implementation adds server-side web scraping capabilities using Puppeteer to extract live metal rates from the Narnoli Corporation website (http://narnolicorporation.in/). Since Narnoli is a React Single Page Application (SPA), client-side scraping only returns the initial HTML shell. Puppeteer runs on the server, launches a headless Chrome browser, executes JavaScript, and extracts the rendered content.

## Components Added

### 1. Server-Side Scraper: `puppeteerNarnoliScraper.ts`

**File:** `src/services/puppeteerNarnoliScraper.ts`

**Features:**

- Launches headless Chrome browser with optimized settings
- Handles React SPA rendering by waiting for content to load
- Multiple extraction strategies (tables, divs, JSON in scripts)
- Takes screenshots for debugging
- Error handling and timeout management
- Resource blocking for faster loading (images, stylesheets)

**Key Methods:**

- `scrapeMetalRates()`: Main scraping method
- `extractRatesFromPage()`: Multiple strategies for rate extraction
- `getPageStructure()`: Analyzes page structure for debugging
- `close()`: Cleanup browser instance

### 2. Next.js API Route: `/api/scrape-narnoli`

**File:** `src/app/api/scrape-narnoli/route.ts`

**Endpoints:**

- `GET /api/scrape-narnoli`: Scrape live rates
- `POST /api/scrape-narnoli` with `action: 'getStructure'`: Get page structure
- `POST /api/scrape-narnoli` with `action: 'close'`: Close browser

**Features:**

- Handles server-side Puppeteer execution
- Returns structured JSON responses
- Error handling and logging
- Cache-control headers

### 3. Service Layer: `puppeteerRatesService.ts`

**File:** `src/services/puppeteerRatesService.ts`

**Features:**

- Client-side service to interact with Puppeteer API
- Caching (5-minute timeout)
- Singleton pattern for instance management
- TypeScript interfaces for data structure

### 4. Test Panel: `PuppeteerTestPanel.tsx`

**File:** `src/components/PuppeteerTestPanel.tsx`

**Features:**

- Interactive testing interface
- Manual scraping triggers
- Screenshot viewing
- Page structure analysis
- JSON download for debugging
- Real-time status monitoring

### 5. Live Widget: `PuppeteerLiveRatesWidget.tsx`

**File:** `src/components/PuppeteerLiveRatesWidget.tsx`

**Features:**

- Production-ready widget for dashboard
- Auto-refresh functionality (10-minute intervals)
- Rate display with formatting
- Status indicators (loading, success, error)
- Cache management

## Integration Points

### Dashboard Integration

The Puppeteer widget is displayed alongside the existing client-side widget on the dashboard:

```tsx
// src/components/pages/Dashboard.tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <LiveMetalRatesWidget /> {/* Client-side scraping */}
  <PuppeteerLiveRatesWidget /> {/* Server-side Puppeteer */}
</div>
```

### Metal Rates Manager Integration

Added as a new tab in the debug/testing section:

```tsx
// src/components/EnhancedMetalRatesManager.tsx
{ id: "puppeteer", label: "Puppeteer (Server)", icon: "🚀" }
```

## Technical Implementation Details

### Puppeteer Configuration

```typescript
const browser = await puppeteer.launch({
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-accelerated-2d-canvas",
    "--no-first-run",
    "--no-zygote",
    "--disable-gpu",
  ],
  timeout: 30000,
});
```

### Rate Extraction Strategies

1. **Table Analysis**: Searches for tables and analyzes cell content for rate patterns
2. **Element Text Analysis**: Scans divs/spans for rate-like text patterns
3. **Script JSON Analysis**: Looks for JSON data embedded in script tags

### Error Handling

- Network timeouts (30 seconds)
- Browser launch failures
- Page navigation errors
- Rate extraction failures
- API response errors

### Performance Optimizations

- Resource blocking (images, stylesheets, fonts)
- Request interception
- Caching with 5-minute TTL
- Browser instance reuse
- Optimized viewport settings

## Usage Instructions

### Testing via Debug Panel

1. Navigate to **Rates** page
2. Click on **Puppeteer (Server)** tab
3. Click **Start Puppeteer Scraping** button
4. View results, screenshots, and debug info
5. Download results as JSON if needed

### Production Usage

1. The **PuppeteerLiveRatesWidget** automatically appears on the dashboard
2. Enable **Auto** refresh for 10-minute intervals
3. Click refresh button for manual updates
4. Widget shows live status and extracted rates

### API Testing

Direct API access for integration testing:

```bash
# Get live rates
curl http://localhost:3000/api/scrape-narnoli

# Get page structure
curl -X POST http://localhost:3000/api/scrape-narnoli \
  -H "Content-Type: application/json" \
  -d '{"action": "getStructure"}'

# Close browser
curl -X POST http://localhost:3000/api/scrape-narnoli \
  -H "Content-Type: application/json" \
  -d '{"action": "close"}'
```

## Dependencies

- `puppeteer`: ^23.x.x - Headless Chrome automation
- `@types/puppeteer`: ^5.4.7 - TypeScript definitions

Install with:

```bash
npm install puppeteer @types/puppeteer
```

## Comparison with Client-Side Approaches

| Feature         | Client-Side         | Puppeteer Server-Side         |
| --------------- | ------------------- | ----------------------------- |
| SPA Support     | ❌ No               | ✅ Full JavaScript execution  |
| Rate Extraction | ❌ Only static HTML | ✅ Rendered content           |
| Resource Usage  | ✅ Low              | ⚠️ Higher (browser instance)  |
| Reliability     | ❌ Limited          | ✅ High                       |
| Debugging       | ⚠️ Limited          | ✅ Screenshots, full analysis |
| CORS Issues     | ❌ Yes              | ✅ None                       |

## Production Considerations

### Server Requirements

- Node.js environment with Puppeteer support
- Sufficient memory for Chrome instances (200-500MB per instance)
- Consider browser instance pooling for high traffic

### Deployment

- Ensure Puppeteer dependencies are available in production
- Consider Docker images with pre-installed Chrome
- Monitor memory usage and implement cleanup strategies

### Scaling

- Implement browser instance pooling
- Add request queuing for concurrent scraping
- Consider dedicated scraping service
- Implement circuit breakers for fault tolerance

### Security

- Run browsers in sandboxed environments
- Implement rate limiting on API endpoints
- Monitor for resource exhaustion attacks
- Validate and sanitize extracted data

## Future Enhancements

1. **Browser Pool Management**: Implement connection pooling for better performance
2. **Scheduled Scraping**: Background jobs for periodic rate updates
3. **Multiple Sources**: Integrate additional jewelry market data sources
4. **Rate History**: Store and track rate changes over time
5. **Alerts**: Notification system for significant rate changes
6. **Mobile App API**: Dedicated API endpoints for mobile applications

## Troubleshooting

### Common Issues

1. **Browser Launch Failures**

   - Ensure system has sufficient memory
   - Check Chrome/Chromium dependencies
   - Verify sandboxing permissions

2. **Timeout Errors**

   - Increase timeout values for slow networks
   - Check website availability
   - Verify network connectivity

3. **No Rates Extracted**

   - Website structure may have changed
   - Check extraction patterns
   - Use debug panel for HTML analysis

4. **Memory Issues**
   - Implement browser cleanup
   - Monitor instance lifecycle
   - Consider resource limits

### Debug Tools

- Use the **PuppeteerTestPanel** for interactive debugging
- Check browser screenshots for visual confirmation
- Analyze page structure with the debug endpoints
- Monitor API logs for error details

## Conclusion

The Puppeteer integration provides a robust solution for extracting live metal rates from JavaScript-heavy websites like Narnoli Corporation. It overcomes the limitations of client-side scraping while providing comprehensive debugging and monitoring capabilities.

The implementation is production-ready with proper error handling, caching, and performance optimizations. It serves as a foundation for expanding to additional data sources and building a comprehensive jewelry market data platform.

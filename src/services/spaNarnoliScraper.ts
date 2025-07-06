"use client";

/**
 * SPA (Single Page Application) Scraper for Narnoli Corporation
 *
 * This scraper handles React-based websites that load content dynamically
 * via JavaScript, rather than static HTML content.
 */

export interface SPAScrapingResult {
  success: boolean;
  data: any[];
  metadata: {
    url: string;
    timestamp: string;
    processingTime: number;
    method: "static-html" | "spa-simulation" | "api-detection" | "fallback";
    elementsFound: number;
    errors: string[];
    warnings: string[];
  };
  debug?: {
    initialHTML: string;
    jsDetected: boolean;
    reactDetected: boolean;
    apiEndpoints: string[];
    networkRequests: string[];
  };
}

export interface DetectedAPI {
  url: string;
  method: string;
  headers?: { [key: string]: string };
  responseType: "json" | "html" | "xml" | "text";
}

class SPAWebScraper {
  private corsProxies = [
    "https://api.allorigins.win/get?url=",
    "https://api.codetabs.com/v1/proxy?quest=",
    "https://corsproxy.io/?",
  ];

  /**
   * Enhanced scraping for SPA websites
   */
  async scrapeSPA(
    url: string = "http://narnolicorporation.in"
  ): Promise<SPAScrapingResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      console.log("🕷️ Starting SPA-aware scraping for:", url);

      // Step 1: Get initial HTML
      const initialHTML = await this.fetchInitialHTML(url);

      if (!initialHTML) {
        throw new Error("Failed to fetch initial HTML");
      }

      // Step 2: Analyze the HTML structure
      const analysis = this.analyzeHTML(initialHTML);

      console.log("📊 HTML Analysis:", analysis);

      // Step 3: Try different scraping strategies
      let result: any[] = [];
      let method: SPAScrapingResult["metadata"]["method"] = "static-html";

      if (analysis.isReactSPA) {
        console.log("⚛️ Detected React SPA - trying API detection...");

        // Try to detect API endpoints
        const apiEndpoints = await this.detectAPIEndpoints(url, initialHTML);

        if (apiEndpoints.length > 0) {
          console.log("🔍 Found API endpoints:", apiEndpoints);
          result = await this.scrapeFromAPIs(apiEndpoints);
          method = "api-detection";
        } else {
          console.log("🎭 No APIs detected - trying SPA simulation...");
          result = await this.simulateSPALoading(url, initialHTML);
          method = "spa-simulation";
        }
      } else {
        console.log("📄 Static HTML detected - using traditional scraping...");
        result = await this.scrapeStaticHTML(initialHTML);
        method = "static-html";
      }

      // Step 4: Fallback strategies
      if (result.length === 0) {
        console.log(
          "🔄 Primary methods failed - trying fallback strategies..."
        );
        result = await this.tryFallbackStrategies(url, initialHTML);
        method = "fallback";
      }

      const processingTime = Date.now() - startTime;

      return {
        success: result.length > 0,
        data: result,
        metadata: {
          url,
          timestamp: new Date().toISOString(),
          processingTime,
          method,
          elementsFound: result.length,
          errors,
          warnings,
        },
        debug: {
          initialHTML: initialHTML.substring(0, 2000),
          jsDetected: analysis.hasJavaScript,
          reactDetected: analysis.isReactSPA,
          apiEndpoints: analysis.possibleAPIs,
          networkRequests: [],
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      errors.push(error instanceof Error ? error.message : "Unknown error");

      return {
        success: false,
        data: [],
        metadata: {
          url,
          timestamp: new Date().toISOString(),
          processingTime,
          method: "static-html",
          elementsFound: 0,
          errors,
          warnings,
        },
      };
    }
  }

  /**
   * Fetch initial HTML using CORS proxies
   */
  private async fetchInitialHTML(url: string): Promise<string> {
    for (const proxy of this.corsProxies) {
      try {
        console.log(`📡 Trying proxy: ${proxy}`);

        const proxyUrl = proxy.includes("allorigins.win")
          ? `${proxy}${encodeURIComponent(url)}`
          : `${proxy}${encodeURIComponent(url)}`;

        const response = await fetch(proxyUrl);

        if (response.ok) {
          let html: string;

          if (proxy.includes("allorigins.win")) {
            const json = await response.json();
            html = json.contents || "";
          } else {
            html = await response.text();
          }

          console.log(`✅ Got ${html.length} characters from ${proxy}`);
          return html;
        }
      } catch (error) {
        console.log(`❌ Proxy ${proxy} failed:`, error);
      }
    }

    throw new Error("All CORS proxies failed");
  }

  /**
   * Analyze HTML to detect SPA characteristics
   */
  private analyzeHTML(html: string): {
    isReactSPA: boolean;
    hasJavaScript: boolean;
    hasDataLoading: boolean;
    possibleAPIs: string[];
    rootElement: string | null;
  } {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Check for React indicators
    const hasReactRoot = !!doc.querySelector(
      "#root, [data-reactroot], .react-root"
    );
    const hasReactScripts = html.includes("react") || html.includes("React");
    const hasMainJS = html.includes("main.") && html.includes(".js");

    // Check for JavaScript loading
    const scriptTags = doc.querySelectorAll("script[src]");
    const hasJavaScript = scriptTags.length > 0;

    // Look for potential API endpoints in script sources or inline code
    const possibleAPIs: string[] = [];

    // Check script sources for API patterns
    scriptTags.forEach((script) => {
      const src = script.getAttribute("src");
      if (src && (src.includes("api") || src.includes("data"))) {
        possibleAPIs.push(src);
      }
    });

    // Look for common API patterns in HTML
    const apiPatterns = [
      "/api/",
      "/data/",
      "/rates/",
      "/live/",
      "api.narnoli",
      "data.narnoli",
    ];

    apiPatterns.forEach((pattern) => {
      if (html.includes(pattern)) {
        possibleAPIs.push(pattern);
      }
    });

    return {
      isReactSPA: hasReactRoot && (hasReactScripts || hasMainJS),
      hasJavaScript,
      hasDataLoading: html.includes("loading") || html.includes("Loading"),
      possibleAPIs,
      rootElement: hasReactRoot ? "#root" : null,
    };
  }

  /**
   * Try to detect API endpoints that the SPA might be using
   */
  private async detectAPIEndpoints(
    baseUrl: string,
    html: string
  ): Promise<DetectedAPI[]> {
    const apis: DetectedAPI[] = [];

    // Common API endpoint patterns for financial data
    const commonEndpoints = [
      "/api/rates",
      "/api/live-rates",
      "/api/gold-rates",
      "/api/silver-rates",
      "/api/market-data",
      "/data/rates.json",
      "/data/live.json",
      "/rates.json",
      "/live-rates.json",
    ];

    const baseUrlObj = new URL(baseUrl);

    for (const endpoint of commonEndpoints) {
      try {
        const apiUrl = `${baseUrlObj.origin}${endpoint}`;

        // Try to fetch from each potential endpoint
        const testResponse = await this.testAPIEndpoint(apiUrl);

        if (testResponse.success) {
          apis.push({
            url: apiUrl,
            method: "GET",
            responseType: testResponse.responseType,
          });
        }
      } catch (error) {
        // Silently continue - this is expected for most endpoints
      }
    }

    return apis;
  }

  /**
   * Test if an API endpoint exists and returns data
   */
  private async testAPIEndpoint(url: string): Promise<{
    success: boolean;
    responseType: "json" | "html" | "xml" | "text";
    data?: any;
  }> {
    try {
      // Try through CORS proxy
      const proxyUrl = `${this.corsProxies[0]}${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);

      if (response.ok) {
        const contentType = response.headers.get("content-type") || "";
        let responseType: "json" | "html" | "xml" | "text" = "text";

        if (contentType.includes("application/json")) {
          responseType = "json";
          const data = await response.json();
          return { success: true, responseType, data };
        } else if (contentType.includes("text/html")) {
          responseType = "html";
          const data = await response.text();
          return { success: true, responseType, data };
        } else if (
          contentType.includes("application/xml") ||
          contentType.includes("text/xml")
        ) {
          responseType = "xml";
          const data = await response.text();
          return { success: true, responseType, data };
        } else {
          const data = await response.text();
          return { success: true, responseType, data };
        }
      }
    } catch (error) {
      // Expected for non-existent endpoints
    }

    return { success: false, responseType: "text" };
  }

  /**
   * Scrape data from detected API endpoints
   */
  private async scrapeFromAPIs(apis: DetectedAPI[]): Promise<any[]> {
    const results: any[] = [];

    for (const api of apis) {
      try {
        console.log(`🔍 Scraping API: ${api.url}`);

        const response = await this.testAPIEndpoint(api.url);

        if (response.success && response.data) {
          // Parse API response based on type
          const parsedData = this.parseAPIResponse(
            response.data,
            api.responseType
          );
          results.push(...parsedData);
        }
      } catch (error) {
        console.log(`❌ API scraping failed for ${api.url}:`, error);
      }
    }

    return results;
  }

  /**
   * Parse API response data
   */
  private parseAPIResponse(data: any, type: string): any[] {
    const results: any[] = [];

    try {
      if (type === "json") {
        // Handle JSON API responses
        if (Array.isArray(data)) {
          return data;
        } else if (data.rates) {
          return Array.isArray(data.rates) ? data.rates : [data.rates];
        } else if (data.data) {
          return Array.isArray(data.data) ? data.data : [data.data];
        }
      } else if (type === "html" || type === "text") {
        // Parse HTML/text responses for rates
        const numbers = this.extractNumbersFromText(data);
        if (numbers.length > 0) {
          results.push({
            type: "extracted_numbers",
            values: numbers,
            source: "api_html",
          });
        }
      }
    } catch (error) {
      console.error("Error parsing API response:", error);
    }

    return results;
  }

  /**
   * Simulate SPA loading by waiting and re-fetching
   */
  private async simulateSPALoading(
    url: string,
    initialHTML: string
  ): Promise<any[]> {
    console.log("⏳ Simulating SPA loading...");

    // Strategy 1: Try to find WebSocket or EventSource connections
    const wsConnections = this.findWebSocketPatterns(initialHTML);

    if (wsConnections.length > 0) {
      console.log("🔌 Found WebSocket patterns:", wsConnections);
      // Try to connect to WebSocket endpoints
      return await this.tryWebSocketScraping(wsConnections);
    }

    // Strategy 2: Try delayed refetch (sometimes content loads after initial render)
    console.log("⏰ Trying delayed refetch...");
    await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds

    const delayedHTML = await this.fetchInitialHTML(url);
    if (delayedHTML !== initialHTML) {
      console.log("🔄 Content changed after delay - parsing new content...");
      return await this.scrapeStaticHTML(delayedHTML);
    }

    return [];
  }

  /**
   * Find WebSocket connection patterns in HTML
   */
  private findWebSocketPatterns(html: string): string[] {
    const patterns: string[] = [];

    // Look for WebSocket URLs
    const wsPatterns = [
      /ws:\/\/[^"'\s]+/g,
      /wss:\/\/[^"'\s]+/g,
      /socket\.io/g,
      /sockjs/g,
    ];

    wsPatterns.forEach((pattern) => {
      const matches = html.match(pattern);
      if (matches) {
        patterns.push(...matches);
      }
    });

    return patterns;
  }

  /**
   * Try WebSocket scraping (limited in browser environment)
   */
  private async tryWebSocketScraping(connections: string[]): Promise<any[]> {
    // Note: This is limited in browser environment due to CORS and security restrictions
    console.log(
      "🔌 WebSocket scraping not fully implemented in browser environment"
    );
    return [];
  }

  /**
   * Scrape static HTML content
   */
  private async scrapeStaticHTML(html: string): Promise<any[]> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const results: any[] = [];

    // Look for any numeric data that might be rates
    const allText = doc.body.textContent || "";
    const numbers = this.extractNumbersFromText(allText);

    if (numbers.length > 0) {
      results.push({
        type: "static_html_numbers",
        values: numbers,
        source: "static_html",
      });
    }

    // Look for specific elements that might contain rates
    const potentialRateElements = doc.querySelectorAll(
      '[class*="rate"], [class*="price"], [class*="value"], [id*="rate"], [id*="price"]'
    );

    potentialRateElements.forEach((element, index) => {
      const text = element.textContent?.trim();
      const numbers = text ? this.extractNumbersFromText(text) : [];

      if (numbers.length > 0) {
        results.push({
          type: "element_rate",
          id: `element_${index}`,
          text,
          values: numbers,
          source: "static_element",
        });
      }
    });

    return results;
  }

  /**
   * Try fallback strategies when primary methods fail
   */
  private async tryFallbackStrategies(
    url: string,
    html: string
  ): Promise<any[]> {
    const results: any[] = [];

    console.log("🔄 Trying fallback strategies...");

    // Strategy 1: Look for embedded JSON data
    const embeddedData = this.extractEmbeddedJSON(html);
    if (embeddedData.length > 0) {
      console.log("📊 Found embedded JSON data");
      results.push(...embeddedData);
    }

    // Strategy 2: Try different URL variations
    const urlVariations = [
      `${url}/api`,
      `${url}/data`,
      `${url}/rates`,
      `${url}/live`,
      `${url.replace("www.", "api.")}`,
    ];

    for (const variation of urlVariations) {
      try {
        const response = await this.testAPIEndpoint(variation);
        if (response.success && response.data) {
          console.log(`✅ Found data at: ${variation}`);
          const parsed = this.parseAPIResponse(
            response.data,
            response.responseType
          );
          results.push(...parsed);
        }
      } catch (error) {
        // Continue trying other variations
      }
    }

    // Strategy 3: Extract any financial-looking numbers from the entire HTML
    const financialNumbers = this.extractFinancialNumbers(html);
    if (financialNumbers.length > 0) {
      results.push({
        type: "financial_numbers",
        values: financialNumbers,
        source: "pattern_matching",
      });
    }

    return results;
  }

  /**
   * Extract embedded JSON data from script tags
   */
  private extractEmbeddedJSON(html: string): any[] {
    const results: any[] = [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Look for script tags with JSON data
    const scriptTags = doc.querySelectorAll("script:not([src])");

    scriptTags.forEach((script) => {
      const content = script.textContent || "";

      // Try to find JSON objects
      const jsonMatches = content.match(/\{[^{}]*\}/g);

      if (jsonMatches) {
        jsonMatches.forEach((match) => {
          try {
            const parsed = JSON.parse(match);
            if (this.looksLikeRateData(parsed)) {
              results.push({
                type: "embedded_json",
                data: parsed,
                source: "script_tag",
              });
            }
          } catch (error) {
            // Not valid JSON, continue
          }
        });
      }
    });

    return results;
  }

  /**
   * Check if JSON object looks like rate data
   */
  private looksLikeRateData(obj: any): boolean {
    if (typeof obj !== "object") return false;

    const rateKeywords = ["rate", "price", "value", "gold", "silver", "metal"];
    const keys = Object.keys(obj).map((k) => k.toLowerCase());

    return rateKeywords.some((keyword) =>
      keys.some((key) => key.includes(keyword))
    );
  }

  /**
   * Extract numbers from text
   */
  private extractNumbersFromText(text: string): number[] {
    const numberPattern = /\d+(?:,\d{3})*(?:\.\d{2})?/g;
    const matches = text.match(numberPattern) || [];

    return matches
      .map((match) => parseFloat(match.replace(/,/g, "")))
      .filter((num) => !isNaN(num) && num > 0);
  }

  /**
   * Extract financial numbers (prices, rates) with currency symbols
   */
  private extractFinancialNumbers(text: string): any[] {
    const results: any[] = [];

    // Pattern for currency values
    const currencyPatterns = [
      /₹\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g, // ₹1,234.56
      /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g, // $1,234.56
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:rupees?|rs\.?|inr)/gi,
    ];

    currencyPatterns.forEach((pattern, index) => {
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          const value = parseFloat(match.replace(/[^\d.-]/g, ""));
          if (!isNaN(value) && value > 0) {
            results.push({
              type: "currency_value",
              pattern: index,
              original: match,
              value,
              source: "currency_pattern",
            });
          }
        });
      }
    });

    return results;
  }
}

// Export the enhanced SPA service
export class SPANarnoliService {
  private scraper = new SPAWebScraper();
  private cacheKey = "narnoli_spa_cache";
  private cacheExpiry = 3 * 60 * 1000; // 3 minutes for SPA data

  async scrapeSPAData(): Promise<SPAScrapingResult> {
    return this.scraper.scrapeSPA();
  }

  async scrapeWithCache(): Promise<SPAScrapingResult> {
    const cached = this.getCachedResult();
    if (cached) {
      console.log("📦 Using cached SPA results");
      return cached;
    }

    console.log("🔄 Running fresh SPA scraping");
    const result = await this.scrapeSPAData();

    if (result.success) {
      this.cacheResult(result);
    }

    return result;
  }

  private getCachedResult(): SPAScrapingResult | null {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        const age = Date.now() - new Date(data.metadata.timestamp).getTime();

        if (age < this.cacheExpiry) {
          return data;
        }
      }
    } catch (error) {
      console.error("SPA cache read error:", error);
    }
    return null;
  }

  private cacheResult(result: SPAScrapingResult): void {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(result));
    } catch (error) {
      console.error("SPA cache write error:", error);
    }
  }
}

export const spaNarnoliService = new SPANarnoliService();

"use client";

/**
 * Advanced Beautiful Soup-like Web Scraping Library for TypeScript
 *
 * This library provides Python's Beautiful Soup functionality in TypeScript
 * with additional features for robust web scraping of financial data.
 */

// ===== CORE INTERFACES =====

export interface BeautifulSoupElement {
  element: Element;
  text: string;
  html: string;
  attributes: { [key: string]: string };
  parent?: BeautifulSoupElement;
  children: BeautifulSoupElement[];

  // Beautiful Soup-like methods
  find(selector: string): BeautifulSoupElement | null;
  findAll(selector: string): BeautifulSoupElement[];
  findByText(text: string, exact?: boolean): BeautifulSoupElement[];
  findParent(selector?: string): BeautifulSoupElement | null;
  findNextSibling(selector?: string): BeautifulSoupElement | null;
  findPreviousSibling(selector?: string): BeautifulSoupElement | null;
  getText(separator?: string): string;
  getAttribute(name: string): string | null;
  hasClass(className: string): boolean;

  // Advanced methods for financial data
  extractNumbers(): number[];
  extractPrices(): number[];
  extractPercentages(): number[];
  findTableCells(): BeautifulSoupElement[];
  getTablePosition(): { row: number; col: number } | null;
}

export interface ScrapingResult {
  success: boolean;
  data: any;
  metadata: {
    url: string;
    timestamp: string;
    processingTime: number;
    elementsFound: number;
    errors: string[];
    warnings: string[];
  };
  debug?: {
    rawHTML: string;
    selectors: string[];
    patterns: string[];
  };
}

export interface FinancialRate {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change?: number;
  changePercent?: number;
  high?: number;
  low?: number;
  volume?: number;
  timestamp: string;
  source: string;
  metadata?: { [key: string]: any };
}

// ===== BEAUTIFUL SOUP-LIKE ELEMENT CLASS =====

class BeautifulSoupElementImpl implements BeautifulSoupElement {
  element: Element;
  text: string;
  html: string;
  attributes: { [key: string]: string };
  parent?: BeautifulSoupElement;
  children: BeautifulSoupElement[];

  constructor(element: Element, parent?: BeautifulSoupElement) {
    this.element = element;
    this.text = element.textContent?.trim() || "";
    this.html = element.innerHTML;
    this.attributes = this.extractAttributes(element);
    this.parent = parent;
    this.children = this.extractChildren(element);
  }

  private extractAttributes(element: Element): { [key: string]: string } {
    const attrs: { [key: string]: string } = {};
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      attrs[attr.name] = attr.value;
    }
    return attrs;
  }

  private extractChildren(element: Element): BeautifulSoupElement[] {
    const children: BeautifulSoupElement[] = [];
    const childElements = element.children;

    for (let i = 0; i < childElements.length; i++) {
      children.push(new BeautifulSoupElementImpl(childElements[i], this));
    }

    return children;
  }

  find(selector: string): BeautifulSoupElement | null {
    const found = this.element.querySelector(selector);
    return found ? new BeautifulSoupElementImpl(found, this) : null;
  }

  findAll(selector: string): BeautifulSoupElement[] {
    const elements = this.element.querySelectorAll(selector);
    return Array.from(elements).map(
      (el) => new BeautifulSoupElementImpl(el, this)
    );
  }

  findByText(text: string, exact: boolean = false): BeautifulSoupElement[] {
    const results: BeautifulSoupElement[] = [];
    const walker = document.createTreeWalker(
      this.element,
      NodeFilter.SHOW_ELEMENT,
      null
    );

    let node = walker.nextNode();
    while (node) {
      const element = node as Element;
      const elementText = element.textContent?.trim() || "";

      const matches = exact
        ? elementText === text
        : elementText.toLowerCase().includes(text.toLowerCase());

      if (matches) {
        results.push(new BeautifulSoupElementImpl(element, this));
      }

      node = walker.nextNode();
    }

    return results;
  }

  findParent(selector?: string): BeautifulSoupElement | null {
    let parent = this.element.parentElement;

    while (parent) {
      if (!selector || parent.matches(selector)) {
        return new BeautifulSoupElementImpl(parent);
      }
      parent = parent.parentElement;
    }

    return null;
  }

  findNextSibling(selector?: string): BeautifulSoupElement | null {
    let sibling = this.element.nextElementSibling;

    while (sibling) {
      if (!selector || sibling.matches(selector)) {
        return new BeautifulSoupElementImpl(sibling, this.parent);
      }
      sibling = sibling.nextElementSibling;
    }

    return null;
  }

  findPreviousSibling(selector?: string): BeautifulSoupElement | null {
    let sibling = this.element.previousElementSibling;

    while (sibling) {
      if (!selector || sibling.matches(selector)) {
        return new BeautifulSoupElementImpl(sibling, this.parent);
      }
      sibling = sibling.previousElementSibling;
    }

    return null;
  }

  getText(separator: string = " "): string {
    const walker = document.createTreeWalker(
      this.element,
      NodeFilter.SHOW_TEXT,
      null
    );

    const texts: string[] = [];
    let node = walker.nextNode();

    while (node) {
      const text = node.textContent?.trim();
      if (text) {
        texts.push(text);
      }
      node = walker.nextNode();
    }

    return texts.join(separator);
  }

  getAttribute(name: string): string | null {
    return this.element.getAttribute(name);
  }

  hasClass(className: string): boolean {
    return this.element.classList.contains(className);
  }

  // Advanced financial data extraction methods
  extractNumbers(): number[] {
    const numberPattern = /[-+]?\d*\.?\d+/g;
    const matches = this.text.match(numberPattern);
    return matches ? matches.map(parseFloat).filter((n) => !isNaN(n)) : [];
  }

  extractPrices(): number[] {
    // Enhanced price extraction with currency symbols and formatting
    const pricePatterns = [
      /\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g, // $1,234.56
      /₹\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g, // ₹1,234.56
      /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|INR|EUR)/g, // 1,234.56 USD
      /(\d+(?:\.\d+)?)\s*(?:per|\/)\s*(?:gram|ounce|oz)/gi, // 45.67 per gram
    ];

    const prices: number[] = [];

    pricePatterns.forEach((pattern) => {
      const matches = this.text.match(pattern);
      if (matches) {
        matches.forEach((match) => {
          const numStr = match.replace(/[^\d.-]/g, "");
          const num = parseFloat(numStr);
          if (!isNaN(num)) prices.push(num);
        });
      }
    });

    return prices.length > 0 ? prices : this.extractNumbers();
  }

  extractPercentages(): number[] {
    const percentPattern = /[-+]?\d*\.?\d+\s*%/g;
    const matches = this.text.match(percentPattern);
    return matches
      ? matches.map((match) => parseFloat(match.replace("%", "")))
      : [];
  }

  findTableCells(): BeautifulSoupElement[] {
    return this.findAll("td, th");
  }

  getTablePosition(): { row: number; col: number } | null {
    const cell = this.element;

    if (!cell.matches("td, th")) return null;

    const row = cell.closest("tr");
    const table = cell.closest("table");

    if (!row || !table) return null;

    const rows = Array.from(table.querySelectorAll("tr"));
    const cells = Array.from(row.querySelectorAll("td, th"));

    return {
      row: rows.indexOf(row),
      col: cells.indexOf(cell as HTMLTableCellElement),
    };
  }
}

// ===== BEAUTIFUL SOUP-LIKE PARSER CLASS =====

export class BeautifulSoupTS {
  private doc: Document;
  private root: BeautifulSoupElement;

  constructor(html: string) {
    const parser = new DOMParser();
    this.doc = parser.parseFromString(html, "text/html");
    this.root = new BeautifulSoupElementImpl(this.doc.documentElement);
  }

  // Main Beautiful Soup-like methods
  find(selector: string): BeautifulSoupElement | null {
    return this.root.find(selector);
  }

  findAll(selector: string): BeautifulSoupElement[] {
    return this.root.findAll(selector);
  }

  findByText(text: string, exact: boolean = false): BeautifulSoupElement[] {
    return this.root.findByText(text, exact);
  }

  select(selector: string): BeautifulSoupElement[] {
    return this.findAll(selector);
  }

  selectOne(selector: string): BeautifulSoupElement | null {
    return this.find(selector);
  }

  // Get the document title
  get title(): string {
    return this.doc.title;
  }

  // Get all text content
  getText(separator: string = " "): string {
    return this.root.getText(separator);
  }

  // Advanced financial data extraction
  extractAllNumbers(): number[] {
    const allNumbers: number[] = [];
    const elements = this.findAll("*");

    elements.forEach((el) => {
      allNumbers.push(...el.extractNumbers());
    });

    return [...new Set(allNumbers)]; // Remove duplicates
  }

  extractAllPrices(): number[] {
    const allPrices: number[] = [];
    const elements = this.findAll("*");

    elements.forEach((el) => {
      allPrices.push(...el.extractPrices());
    });

    return [...new Set(allPrices)]; // Remove duplicates
  }

  // Table-specific methods
  findTables(): BeautifulSoupElement[] {
    return this.findAll("table");
  }

  extractTableData(table: BeautifulSoupElement): any[][] {
    const rows = table.findAll("tr");
    const data: any[][] = [];

    rows.forEach((row) => {
      const cells = row.findAll("td, th");
      const rowData = cells.map((cell) => ({
        text: cell.text,
        numbers: cell.extractNumbers(),
        prices: cell.extractPrices(),
      }));
      data.push(rowData);
    });

    return data;
  }

  // Financial data pattern matching
  findRateElements(patterns: string[]): BeautifulSoupElement[] {
    const results: BeautifulSoupElement[] = [];

    patterns.forEach((pattern) => {
      const elements = this.findByText(pattern);
      results.push(...elements);
    });

    return results;
  }
}

// ===== ENHANCED NARNOLI SCRAPER WITH BEAUTIFUL SOUP =====

export class AdvancedNarnoliScraper {
  private corsProxies = [
    "https://api.allorigins.win/raw?url=",
    "https://corsproxy.io/?",
    "https://cors-anywhere.herokuapp.com/",
  ];

  private ratePatterns = {
    gold: ["gold", "सोना", "99.5", "99.50", "auction"],
    silver: ["silver", "चांदी", "999", "925"],
    spot: ["spot", "तत्काल", "current"],
    rates: ["rate", "दर", "price", "मूल्य", "bid", "ask", "sell"],
  };

  async scrapeWithBeautifulSoup(
    url: string = "http://narnolicorporation.in"
  ): Promise<ScrapingResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      console.log("🕷️ Starting Beautiful Soup-like scraping...");

      // Fetch HTML with fallback proxies
      const html = await this.fetchWithProxies(url);

      if (!html) {
        throw new Error("Failed to fetch HTML from all proxy sources");
      }

      // Parse with Beautiful Soup-like parser
      const soup = new BeautifulSoupTS(html);

      console.log(`📄 Parsed document: "${soup.title}"`);

      // Extract financial data using advanced patterns
      const rates = await this.extractFinancialRates(soup);

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: rates,
        metadata: {
          url,
          timestamp: new Date().toISOString(),
          processingTime,
          elementsFound: rates.length,
          errors,
          warnings,
        },
        debug: {
          rawHTML: html.substring(0, 2000),
          selectors: ["table", "tr", "td", ".rate", ".price"],
          patterns: Object.values(this.ratePatterns).flat(),
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
          elementsFound: 0,
          errors,
          warnings,
        },
      };
    }
  }

  private async fetchWithProxies(url: string): Promise<string> {
    for (const proxy of this.corsProxies) {
      try {
        console.log(`📡 Trying proxy: ${proxy}`);

        const response = await fetch(`${proxy}${encodeURIComponent(url)}`, {
          method: "GET",
          headers: {
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });

        if (response.ok) {
          const html = await response.text();
          console.log(`✅ Successfully fetched ${html.length} characters`);
          return html;
        }
      } catch (error) {
        console.log(`❌ Proxy ${proxy} failed:`, error);
      }
    }

    throw new Error("All CORS proxies failed");
  }

  private async extractFinancialRates(
    soup: BeautifulSoupTS
  ): Promise<FinancialRate[]> {
    const rates: FinancialRate[] = [];

    console.log("🔍 Extracting financial rates with Beautiful Soup methods...");

    // Find all tables
    const tables = soup.findTables();
    console.log(`📊 Found ${tables.length} tables`);

    for (let tableIndex = 0; tableIndex < tables.length; tableIndex++) {
      const table = tables[tableIndex];
      const tableData = soup.extractTableData(table);

      console.log(
        `📋 Processing table ${tableIndex + 1} with ${tableData.length} rows`
      );

      for (let rowIndex = 0; rowIndex < tableData.length; rowIndex++) {
        const row = tableData[rowIndex];

        if (row.length < 2) continue; // Skip rows with insufficient data

        const firstCell = row[0];
        const productText = firstCell.text.toLowerCase();

        // Enhanced pattern matching for different rate types
        const rateType = this.identifyRateType(productText);

        if (rateType) {
          const extractedRate = this.extractRateFromRow(
            row,
            rateType,
            tableIndex,
            rowIndex
          );
          if (extractedRate) {
            rates.push(extractedRate);
          }
        }
      }
    }

    // Also try to find rates in non-table elements
    const rateElements = soup.findRateElements(this.ratePatterns.rates);
    console.log(
      `💰 Found ${rateElements.length} potential rate elements outside tables`
    );

    for (const element of rateElements) {
      const prices = element.extractPrices();
      if (prices.length > 0) {
        rates.push({
          id: `element_${rates.length}`,
          symbol: this.extractSymbol(element.text),
          name: element.text.substring(0, 50),
          price: prices[0],
          timestamp: new Date().toISOString(),
          source: "narnoli_enhanced",
          metadata: {
            extractionMethod: "element_scan",
            allPrices: prices,
          },
        });
      }
    }

    console.log(`✅ Extracted ${rates.length} financial rates`);
    return rates;
  }

  private identifyRateType(text: string): string | null {
    if (this.ratePatterns.gold.some((pattern) => text.includes(pattern))) {
      if (text.includes("auction")) return "gold_auction";
      if (text.includes("spot")) return "gold_spot";
      return "gold_market";
    }

    if (this.ratePatterns.silver.some((pattern) => text.includes(pattern))) {
      if (text.includes("spot")) return "silver_spot";
      return "silver_market";
    }

    if (this.ratePatterns.spot.some((pattern) => text.includes(pattern))) {
      return "spot_rate";
    }

    return null;
  }

  private extractRateFromRow(
    row: any[],
    rateType: string,
    tableIndex: number,
    rowIndex: number
  ): FinancialRate | null {
    const productCell = row[0];
    const productText = productCell.text;

    // Collect all numbers from the row
    const allNumbers: number[] = [];
    row.forEach((cell) => {
      if (cell.numbers) allNumbers.push(...cell.numbers);
      if (cell.prices) allNumbers.push(...cell.prices);
    });

    if (allNumbers.length === 0) return null;

    // Sort numbers for intelligent assignment
    const sortedNumbers = [...allNumbers].sort((a, b) => b - a);

    let price: number;
    let high: number | undefined;
    let low: number | undefined;
    let change: number | undefined;

    switch (rateType) {
      case "gold_auction":
      case "gold_market":
      case "silver_market":
        price = sortedNumbers[0]; // Highest number as main price
        high = sortedNumbers[0];
        low = sortedNumbers[sortedNumbers.length - 1];
        break;

      case "gold_spot":
      case "silver_spot":
      case "spot_rate":
        price = allNumbers[0]; // First number as current price
        if (allNumbers.length >= 4) {
          high = Math.max(...allNumbers);
          low = Math.min(...allNumbers);
        }
        break;

      default:
        price = sortedNumbers[0];
    }

    return {
      id: `${rateType}_${tableIndex}_${rowIndex}`,
      symbol: this.extractSymbol(productText),
      name: productText,
      price,
      high,
      low,
      change,
      timestamp: new Date().toISOString(),
      source: "narnoli_beautiful_soup",
      metadata: {
        rateType,
        allNumbers,
        extractionMethod: "table_analysis",
      },
    };
  }

  private extractSymbol(text: string): string {
    const symbolPatterns = [/gold|सोना/i, /silver|चांदी/i, /spot/i, /auction/i];

    for (const pattern of symbolPatterns) {
      if (pattern.test(text)) {
        const match = text.match(pattern);
        return match ? match[0].toUpperCase() : "UNKNOWN";
      }
    }

    return text
      .substring(0, 10)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
  }
}

// ===== EXPORT ENHANCED SERVICE =====

export class EnhancedBeautifulSoupService {
  private scraper = new AdvancedNarnoliScraper();
  private cacheKey = "narnoli_beautiful_soup_cache";
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  async scrapeNarnoliRates(): Promise<ScrapingResult> {
    return this.scraper.scrapeWithBeautifulSoup();
  }

  async scrapeWithCache(): Promise<ScrapingResult> {
    // Try cache first
    const cached = this.getCachedResult();
    if (cached) {
      console.log("📦 Using cached Beautiful Soup results");
      return cached;
    }

    // Scrape fresh data
    console.log("🔄 Running fresh Beautiful Soup scraping");
    const result = await this.scrapeNarnoliRates();

    // Cache successful results
    if (result.success) {
      this.cacheResult(result);
    }

    return result;
  }

  private getCachedResult(): ScrapingResult | null {
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
      console.error("Cache read error:", error);
    }
    return null;
  }

  private cacheResult(result: ScrapingResult): void {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(result));
    } catch (error) {
      console.error("Cache write error:", error);
    }
  }

  // Test method for development
  async testScraping(): Promise<void> {
    console.log("🧪 Testing Beautiful Soup scraping...");

    const result = await this.scrapeNarnoliRates();

    console.log("📊 Test Results:");
    console.log(`   Success: ${result.success}`);
    console.log(`   Elements Found: ${result.metadata.elementsFound}`);
    console.log(`   Processing Time: ${result.metadata.processingTime}ms`);
    console.log(`   Errors: ${result.metadata.errors.length}`);
    console.log(`   Warnings: ${result.metadata.warnings.length}`);

    if (result.success && result.data.length > 0) {
      console.log("💰 Sample Rate:", result.data[0]);
    }
  }
}

export const beautifulSoupService = new EnhancedBeautifulSoupService();

"use client";

import axios from "axios";

// Enhanced web scraping service for Narnoli Corporation using TypeScript
// This is similar to Beautiful Soup in Python but for TypeScript/JavaScript

export interface ScrapedData {
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

export interface TableData {
  id: string;
  headers: string[];
  rows: RowData[];
  className?: string;
  attributes?: { [key: string]: string };
}

export interface RowData {
  cells: CellData[];
  index: number;
  className?: string;
}

export interface CellData {
  text: string;
  html: string;
  className?: string;
  attributes?: { [key: string]: string };
  numbers: number[];
}

export interface NarnoliScrapedRates {
  goldAuctionRates: GoldAuctionRate[];
  marketRates: MetalRate[];
  spotRates: SpotRate[];
  lastFetched: string;
  status: "success" | "error";
  message?: string;
  debug?: ScrapedData;
}

export interface GoldAuctionRate {
  id: string;
  product: string;
  gst: string;
  extraMinimum: string;
  mRate: number;
  premium: number;
  sell: number;
  lastUpdated: string;
}

export interface MetalRate {
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

export interface SpotRate {
  id: string;
  product: string;
  bid: number;
  ask: number;
  high: number;
  low: number;
  lastUpdated: string;
}

class EnhancedWebScraper {
  private corsProxies = [
    "https://api.allorigins.win/raw?url=",
    "https://corsproxy.io/?",
    "https://cors-anywhere.herokuapp.com/",
  ];

  /**
   * Beautiful Soup-like HTML parser for TypeScript
   */
  private parseHTML(html: string): Document {
    const parser = new DOMParser();
    return parser.parseFromString(html, "text/html");
  }

  /**
   * Extract all tables with detailed structure analysis
   */
  private extractTables(doc: Document): TableData[] {
    const tables: TableData[] = [];
    const tableElements = doc.querySelectorAll("table");

    tableElements.forEach((table, index) => {
      const tableData: TableData = {
        id: `table_${index}`,
        headers: [],
        rows: [],
        className: table.className,
        attributes: this.getElementAttributes(table),
      };

      // Extract headers
      const headerRow = table.querySelector("tr");
      if (headerRow) {
        const headerCells = headerRow.querySelectorAll("th, td");
        tableData.headers = Array.from(headerCells).map(
          (cell) => cell.textContent?.trim() || ""
        );
      }

      // Extract all rows
      const rows = table.querySelectorAll("tr");
      rows.forEach((row, rowIndex) => {
        const cells = row.querySelectorAll("td, th");
        const rowData: RowData = {
          cells: [],
          index: rowIndex,
          className: row.className,
        };

        cells.forEach((cell, cellIndex) => {
          const cellText = cell.textContent?.trim() || "";
          const cellData: CellData = {
            text: cellText,
            html: cell.innerHTML,
            className: cell.className,
            attributes: this.getElementAttributes(cell),
            numbers: this.extractNumbers(cellText),
          };
          rowData.cells.push(cellData);
        });

        tableData.rows.push(rowData);
      });

      tables.push(tableData);
    });

    return tables;
  }

  /**
   * Extract numbers from text (similar to regex in Beautiful Soup)
   */
  private extractNumbers(text: string): number[] {
    const numberRegex = /\d+(?:\.\d+)?/g;
    const matches = text.match(numberRegex);
    return matches
      ? matches.map((num) => parseFloat(num)).filter((num) => !isNaN(num))
      : [];
  }

  /**
   * Get all attributes of an element
   */
  private getElementAttributes(element: Element): { [key: string]: string } {
    const attributes: { [key: string]: string } = {};
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      attributes[attr.name] = attr.value;
    }
    return attributes;
  }

  /**
   * Find elements by text content (like Beautiful Soup's find)
   */
  private findByText(
    doc: Document,
    text: string,
    tag: string = "*"
  ): Element[] {
    const elements = doc.querySelectorAll(tag);
    return Array.from(elements).filter((el) =>
      el.textContent?.toLowerCase().includes(text.toLowerCase())
    );
  }

  /**
   * Find elements by multiple criteria
   */
  private findElements(
    doc: Document,
    criteria: {
      tag?: string;
      className?: string;
      text?: string;
      attributes?: { [key: string]: string };
    }
  ): Element[] {
    let selector = criteria.tag || "*";

    if (criteria.className) {
      selector += `.${criteria.className}`;
    }

    if (criteria.attributes) {
      Object.entries(criteria.attributes).forEach(([key, value]) => {
        selector += `[${key}="${value}"]`;
      });
    }

    const elements = Array.from(doc.querySelectorAll(selector));

    if (criteria.text) {
      return elements.filter((el) =>
        el.textContent?.toLowerCase().includes(criteria.text!.toLowerCase())
      );
    }

    return elements;
  }

  /**
   * Scrape Narnoli Corporation website with enhanced parsing
   */
  async scrapeNarnoliCorporation(): Promise<NarnoliScrapedRates> {
    const url = "http://narnolicorporation.in";

    try {
      console.log(
        "🕷️ Starting enhanced web scraping of Narnoli Corporation..."
      );

      // Try multiple CORS proxies
      let html = "";
      let usedProxy = "";

      for (const proxy of this.corsProxies) {
        try {
          console.log(`📡 Trying proxy: ${proxy}`);
          const response = await axios.get(`${proxy}${encodeURIComponent(url)}`);

          if (response.status === 200) {
            html = response.data  ;
            usedProxy = proxy;
            console.log(`✅ Successfully fetched HTML using ${proxy}`);
            break;
          }
        } catch (error) {
          console.log(`❌ Proxy ${proxy} failed:`, error);
          continue;
        }
      }

      if (!html) {
        throw new Error("All CORS proxies failed");
      }

      // Parse HTML with enhanced parser
      const doc = this.parseHTML(html);

      // Extract metadata
      const title = doc.title || "Narnoli Corporation";
      const tables = this.extractTables(doc);

      const scrapedData: ScrapedData = {
        tables,
        rawHTML: html.substring(0, 5000), // Store first 5000 chars for debugging
        metadata: {
          title,
          url,
          timestamp: new Date().toISOString(),
          tableCount: tables.length,
          rowCount: tables.reduce((sum, table) => sum + table.rows.length, 0),
        },
      };

      console.log(
        `📊 Scraped ${scrapedData.metadata.tableCount} tables with ${scrapedData.metadata.rowCount} rows`
      );

      // Process the scraped data to extract rates
      const rates = this.processScrapedData(scrapedData);

      return {
        ...rates,
        debug: scrapedData,
        lastFetched: new Date().toISOString(),
        status: "success",
      };
    } catch (error) {
      console.error("🚫 Enhanced scraping failed:", error);
      return {
        goldAuctionRates: [],
        marketRates: [],
        spotRates: [],
        lastFetched: new Date().toISOString(),
        status: "error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Process scraped data to extract meaningful rates
   */
  private processScrapedData(data: ScrapedData): {
    goldAuctionRates: GoldAuctionRate[];
    marketRates: MetalRate[];
    spotRates: SpotRate[];
  } {
    const goldAuctionRates: GoldAuctionRate[] = [];
    const marketRates: MetalRate[] = [];
    const spotRates: SpotRate[] = [];

    console.log("🔍 Processing scraped data for rates...");

    data.tables.forEach((table, tableIndex) => {
      console.log(
        `📋 Processing table ${tableIndex + 1} with ${table.rows.length} rows`
      );

      table.rows.forEach((row, rowIndex) => {
        if (row.cells.length < 3) return; // Skip rows with too few cells

        const firstCell = row.cells[0];
        const productText = firstCell.text.toLowerCase();

        // Enhanced Gold Auction Rate Detection
        if (this.isGoldAuctionRow(productText, row)) {
          const goldRate = this.extractGoldAuctionRate(
            row,
            tableIndex,
            rowIndex
          );
          if (goldRate) goldAuctionRates.push(goldRate);
        }

        // Enhanced Market Rate Detection
        else if (this.isMarketRateRow(productText, row)) {
          const marketRate = this.extractMarketRate(row, tableIndex, rowIndex);
          if (marketRate) marketRates.push(marketRate);
        }

        // Enhanced Spot Rate Detection
        else if (this.isSpotRateRow(productText, row)) {
          const spotRate = this.extractSpotRate(row, tableIndex, rowIndex);
          if (spotRate) spotRates.push(spotRate);
        }
      });
    });

    console.log(
      `✅ Extracted: ${goldAuctionRates.length} gold auction, ${marketRates.length} market, ${spotRates.length} spot rates`
    );

    return { goldAuctionRates, marketRates, spotRates };
  }

  /**
   * Enhanced detection methods
   */
  private isGoldAuctionRow(productText: string, row: RowData): boolean {
    const keywords = ["gold", "auction", "99.50", "gst", "extra", "minimum"];
    const keywordCount = keywords.filter((keyword) =>
      productText.includes(keyword)
    ).length;

    // Must contain "gold" and at least 2 other keywords
    return (
      productText.includes("gold") &&
      keywordCount >= 2 &&
      row.cells.some((cell) => cell.numbers.length > 0)
    );
  }

  private isMarketRateRow(productText: string, row: RowData): boolean {
    const isGoldOrSilver =
      productText.includes("gold") || productText.includes("silver");
    const isNotAuctionOrSpot =
      !productText.includes("auction") && !productText.includes("spot");
    const hasNumbers = row.cells.some((cell) => cell.numbers.length > 0);
    const hasMarketTerms =
      productText.includes("current") ||
      productText.includes("999") ||
      productText.includes("925") ||
      /\d{2,}/.test(productText);

    return isGoldOrSilver && isNotAuctionOrSpot && hasNumbers && hasMarketTerms;
  }

  private isSpotRateRow(productText: string, row: RowData): boolean {
    return (
      productText.includes("spot") &&
      row.cells.some((cell) => cell.numbers.length > 0)
    );
  }

  /**
   * Enhanced extraction methods
   */
  private extractGoldAuctionRate(
    row: RowData,
    tableIndex: number,
    rowIndex: number
  ): GoldAuctionRate | null {
    const productText = row.cells[0].text;

    // Collect all numbers from the row
    const allNumbers: number[] = [];
    row.cells.forEach((cell) => allNumbers.push(...cell.numbers));

    if (allNumbers.length < 3) return null;

    // Sort numbers to identify likely candidates
    const sortedNumbers = [...allNumbers].sort((a, b) => b - a);

    // Heuristics: largest is usually sell price, second largest is mRate, smallest might be premium
    const sell = sortedNumbers[0];
    const mRate = sortedNumbers[1];
    const premium =
      sortedNumbers.length > 2
        ? sortedNumbers[sortedNumbers.length - 1]
        : sortedNumbers[2] || 0;

    return {
      id: `gold_auction_${tableIndex}_${rowIndex}`,
      product: productText,
      gst: this.extractGST(productText),
      extraMinimum: this.extractExtraMinimum(productText),
      mRate,
      premium,
      sell,
      lastUpdated: new Date().toISOString(),
    };
  }

  private extractMarketRate(
    row: RowData,
    tableIndex: number,
    rowIndex: number
  ): MetalRate | null {
    const productText = row.cells[0].text;
    const allNumbers: number[] = [];

    row.cells.forEach((cell) => allNumbers.push(...cell.numbers));

    if (allNumbers.length < 1) return null;

    // For market rates, try to identify bid, ask, high, low
    const numbers = [...allNumbers].sort((a, b) => a - b); // Sort ascending

    let bid, ask, high, low;

    if (numbers.length >= 4) {
      // If we have 4+ numbers, assume low, bid, ask, high order after sorting
      low = numbers[0];
      bid = numbers[1];
      ask = numbers[2];
      high = numbers[numbers.length - 1];
    } else if (numbers.length >= 2) {
      bid = numbers[0];
      ask = numbers[1];
      high = Math.max(...numbers);
      low = Math.min(...numbers);
    } else {
      bid = ask = numbers[0];
      high = low = numbers[0];
    }

    return {
      id: `market_${tableIndex}_${rowIndex}`,
      product: productText,
      category: this.determineCategory(productText),
      bid,
      ask,
      high,
      low,
      lastUpdated: new Date().toISOString(),
      source: "narnoli",
    };
  }

  private extractSpotRate(
    row: RowData,
    tableIndex: number,
    rowIndex: number
  ): SpotRate | null {
    const productText = row.cells[0].text;
    const allNumbers: number[] = [];

    row.cells.forEach((cell) => allNumbers.push(...cell.numbers));

    if (allNumbers.length < 2) return null;

    const numbers = [...allNumbers].sort((a, b) => a - b);

    return {
      id: `spot_${tableIndex}_${rowIndex}`,
      product: productText,
      bid: numbers[0],
      ask: numbers[1] || numbers[0],
      high: Math.max(...numbers),
      low: Math.min(...numbers),
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Utility methods
   */
  private extractGST(productText: string): string {
    const gstMatch = productText.match(/gst\s*(\d+\.?\d*)/i);
    return gstMatch ? gstMatch[1] : "";
  }

  private extractExtraMinimum(productText: string): string {
    const extraMatch = productText.match(/extra\s+minimum\s+(\d+)/i);
    return extraMatch ? extraMatch[1] : "";
  }

  private determineCategory(product: string): string {
    const productLower = product.toLowerCase();

    if (productLower.includes("gold")) {
      if (productLower.includes("99.5")) return "gold_995";
      if (productLower.includes("auction")) return "gold_auction";
      return "gold_current";
    }

    if (productLower.includes("silver")) {
      if (productLower.includes("999")) return "silver_999";
      return "silver_current";
    }

    if (productLower.includes("spot")) {
      if (productLower.includes("gold")) return "gold_spot";
      if (productLower.includes("silver")) return "silver_spot";
      if (productLower.includes("inr")) return "inr_spot";
    }

    return "other";
  }
}

// Enhanced Narnoli Corporation Service
class EnhancedNarnoliCorporationService {
  private scraper = new EnhancedWebScraper();
  private cacheKey = "narnoli_enhanced_rates";
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  async fetchLiveRates(): Promise<NarnoliScrapedRates> {
    return this.scraper.scrapeNarnoliCorporation();
  }

  getCachedRates(): NarnoliScrapedRates | null {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        const now = Date.now();
        const cacheTime = new Date(data.lastFetched).getTime();

        if (now - cacheTime < this.cacheExpiry) {
          return data;
        }
      }
    } catch (error) {
      console.error("Error reading cached rates:", error);
    }
    return null;
  }

  cacheRates(data: NarnoliScrapedRates): void {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(data));
    } catch (error) {
      console.error("Error caching rates:", error);
    }
  }

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
}

export const enhancedNarnoliService = new EnhancedNarnoliCorporationService();

"use client";

// Interface definitions based on the data structure from the image
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

export interface SpotRate {
  id: string;
  product: string;
  bid: number;
  ask: number;
  high: number;
  low: number;
  lastUpdated: string;
}

export interface NarnoliRatesData {
  goldAuctionRates: GoldAuctionRate[];
  marketRates: MetalRate[];
  spotRates: SpotRate[];
  lastFetched: string;
  status: "success" | "error";
  message?: string;
}

class NarnoliCorporationService {
  private readonly BASE_URL = "http://narnolicorporation.in";
  private readonly CORS_PROXY = "https://api.allorigins.win/raw?url=";

  /**
   * Fetch live rates from Narnoli Corporation website
   */
  async fetchLiveRates(): Promise<NarnoliRatesData> {
    try {
      // Use CORS proxy to fetch data
      const response = await fetch(
        `${this.CORS_PROXY}${encodeURIComponent(this.BASE_URL)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      return this.parseRatesFromHTML(html);
    } catch (error) {
      console.error("Failed to fetch rates from Narnoli Corporation:", error);
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
   * Parse rates data from HTML content
   */
  private parseRatesFromHTML(html: string): NarnoliRatesData {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      const goldAuctionRates = this.parseGoldAuctionRates(doc);
      const marketRates = this.parseMarketRates(doc);
      const spotRates = this.parseSpotRates(doc);

      return {
        goldAuctionRates,
        marketRates,
        spotRates,
        lastFetched: new Date().toISOString(),
        status: "success",
      };
    } catch (error) {
      console.error("Failed to parse HTML:", error);
      return {
        goldAuctionRates: [],
        marketRates: [],
        spotRates: [],
        lastFetched: new Date().toISOString(),
        status: "error",
        message: "Failed to parse rates data",
      };
    }
  }

  /**
   * Parse Gold Auction rates from the first table
   */
  private parseGoldAuctionRates(doc: Document): GoldAuctionRate[] {
    const rates: GoldAuctionRate[] = [];

    try {
      // Look for tables with gold auction data - try multiple selectors
      const possibleSelectors = [
        "table",
        "table[border]",
        ".table",
        '[class*="table"]',
        "tbody tr",
        ".rate-table",
      ];

      for (const selector of possibleSelectors) {
        const elements = doc.querySelectorAll(selector);

        elements.forEach((element, index) => {
          let rows;

          if (element.tagName.toLowerCase() === "table") {
            rows = element.querySelectorAll("tr");
          } else if (element.tagName.toLowerCase() === "tr") {
            rows = [element];
          } else {
            rows = element.querySelectorAll("tr");
          }

          rows.forEach((row, rowIndex) => {
            if (rowIndex === 0 && element.tagName.toLowerCase() === "table")
              return; // Skip header row for tables

            const cells = row.querySelectorAll("td, th");
            if (cells.length >= 4) {
              const productText = cells[0]?.textContent?.trim() || "";

              // Enhanced detection for gold auction rates
              const isGoldAuction =
                productText.toLowerCase().includes("gold") &&
                (productText.toLowerCase().includes("auction") ||
                  productText.toLowerCase().includes("99.50") ||
                  productText.toLowerCase().includes("gst"));

              if (isGoldAuction) {
                // Try different column arrangements
                let mRate, premium, sell;

                // Standard arrangement: Product, M-Rate, Premium, Sell
                mRate = this.parseNumber(cells[1]?.textContent?.trim());
                premium = this.parseNumber(cells[2]?.textContent?.trim());
                sell = this.parseNumber(cells[3]?.textContent?.trim());

                // Alternative arrangement if first doesn't work
                if (!mRate || !premium || !sell) {
                  // Try Product, Premium, M-Rate, Sell
                  premium = this.parseNumber(cells[1]?.textContent?.trim());
                  mRate = this.parseNumber(cells[2]?.textContent?.trim());
                  sell = this.parseNumber(cells[3]?.textContent?.trim());
                }

                // Another alternative: look for largest numbers
                if (!mRate || !premium || !sell) {
                  const numbers = [];
                  for (let i = 1; i < cells.length && i < 5; i++) {
                    const num = this.parseNumber(cells[i]?.textContent?.trim());
                    if (num) numbers.push({ value: num, index: i });
                  }

                  if (numbers.length >= 3) {
                    // Assume largest is sell, second largest is mRate, smallest is premium
                    numbers.sort((a, b) => b.value - a.value);
                    sell = numbers[0].value;
                    mRate = numbers[1].value;
                    premium = numbers[2].value;
                  }
                }

                if (mRate && premium && sell) {
                  rates.push({
                    id: `gold_auction_${index}_${rowIndex}`,
                    product: productText,
                    gst: this.extractGST(productText),
                    extraMinimum: this.extractExtraMinimum(productText),
                    mRate,
                    premium,
                    sell,
                    lastUpdated: new Date().toISOString(),
                  });
                }
              }
            }
          });
        });

        // If we found rates, break out of the selector loop
        if (rates.length > 0) break;
      }
    } catch (error) {
      console.error("Error parsing gold auction rates:", error);
    }

    return rates;
  }

  /**
   * Parse Market rates from tables
   */
  private parseMarketRates(doc: Document): MetalRate[] {
    const rates: MetalRate[] = [];

    try {
      // Enhanced table detection
      const possibleSelectors = [
        "table",
        "table[border]",
        ".table",
        '[class*="table"]',
        "tbody tr",
        ".rate-table",
      ];

      for (const selector of possibleSelectors) {
        const elements = doc.querySelectorAll(selector);

        elements.forEach((element, tableIndex) => {
          let rows;

          if (element.tagName.toLowerCase() === "table") {
            rows = element.querySelectorAll("tr");
          } else if (element.tagName.toLowerCase() === "tr") {
            rows = [element];
          } else {
            rows = element.querySelectorAll("tr");
          }

          rows.forEach((row, rowIndex) => {
            if (rowIndex === 0 && element.tagName.toLowerCase() === "table")
              return; // Skip header row for tables

            const cells = row.querySelectorAll("td, th");
            if (cells.length >= 3) {
              const product = cells[0]?.textContent?.trim() || "";

              // Enhanced detection for market rates
              const isMarketRate =
                (product.toLowerCase().includes("gold") ||
                  product.toLowerCase().includes("silver")) &&
                !product.toLowerCase().includes("auction") &&
                !product.toLowerCase().includes("spot") &&
                (product.toLowerCase().includes("current") ||
                  product.toLowerCase().includes("999") ||
                  product.toLowerCase().includes("925") ||
                  product.toLowerCase().includes("99.5") ||
                  /\d/.test(product)); // Contains numbers

              if (isMarketRate) {
                // Try different column arrangements for Bid, Ask, High, Low
                let bid, ask, high, low;

                if (cells.length >= 5) {
                  // Standard arrangement: Product, Bid, Ask, High, Low
                  bid = this.parseNumber(cells[1]?.textContent?.trim());
                  ask = this.parseNumber(cells[2]?.textContent?.trim());
                  high = this.parseNumber(cells[3]?.textContent?.trim());
                  low = this.parseNumber(cells[4]?.textContent?.trim());
                } else if (cells.length >= 4) {
                  // Alternative: Product, Bid, Ask, (High or Low)
                  bid = this.parseNumber(cells[1]?.textContent?.trim());
                  ask = this.parseNumber(cells[2]?.textContent?.trim());
                  const thirdValue = this.parseNumber(
                    cells[3]?.textContent?.trim()
                  );

                  // If bid and ask exist, assume third value is high
                  if (bid && ask && thirdValue) {
                    high = thirdValue;
                    low = Math.min(bid, ask, thirdValue);
                  }
                } else if (cells.length >= 3) {
                  // Minimal: Product, Rate1, Rate2
                  const rate1 = this.parseNumber(cells[1]?.textContent?.trim());
                  const rate2 = this.parseNumber(cells[2]?.textContent?.trim());

                  if (rate1 && rate2) {
                    // Assume lower is bid, higher is ask
                    bid = Math.min(rate1, rate2);
                    ask = Math.max(rate1, rate2);
                  }
                }

                // Also try to extract any number from the row as a fallback
                if (!bid && !ask) {
                  const allNumbers = [];
                  for (let i = 1; i < cells.length; i++) {
                    const num = this.parseNumber(cells[i]?.textContent?.trim());
                    if (num) allNumbers.push(num);
                  }

                  if (allNumbers.length >= 1) {
                    bid = allNumbers[0];
                    ask = allNumbers[1] || allNumbers[0];
                    high = allNumbers[2] || Math.max(...allNumbers);
                    low = allNumbers[3] || Math.min(...allNumbers);
                  }
                }

                if (bid || ask) {
                  rates.push({
                    id: `market_${tableIndex}_${rowIndex}`,
                    product,
                    category: this.determineCategory(product),
                    bid,
                    ask,
                    high: high || 0,
                    low: low || 0,
                    lastUpdated: new Date().toISOString(),
                    source: "narnoli",
                  });
                }
              }
            }
          });
        });

        // If we found rates, break out of the selector loop
        if (rates.length > 0) break;
      }
    } catch (error) {
      console.error("Error parsing market rates:", error);
    }

    return rates;
  }

  /**
   * Parse Spot rates from the third table
   */
  private parseSpotRates(doc: Document): SpotRate[] {
    const rates: SpotRate[] = [];

    try {
      const tables = doc.querySelectorAll("table");

      tables.forEach((table, tableIndex) => {
        const rows = table.querySelectorAll("tr");

        rows.forEach((row, rowIndex) => {
          if (rowIndex === 0) return; // Skip header row

          const cells = row.querySelectorAll("td");
          if (cells.length >= 5) {
            const product = cells[0]?.textContent?.trim() || "";

            // Check if this looks like a spot rate row
            if (product.toLowerCase().includes("spot")) {
              const bid = this.parseNumber(cells[1]?.textContent?.trim());
              const ask = this.parseNumber(cells[2]?.textContent?.trim());
              const high = this.parseNumber(cells[3]?.textContent?.trim());
              const low = this.parseNumber(cells[4]?.textContent?.trim());

              if (bid && ask) {
                rates.push({
                  id: `spot_${tableIndex}_${rowIndex}`,
                  product,
                  bid,
                  ask,
                  high: high || 0,
                  low: low || 0,
                  lastUpdated: new Date().toISOString(),
                });
              }
            }
          }
        });
      });
    } catch (error) {
      console.error("Error parsing spot rates:", error);
    }

    return rates;
  }

  /**
   * Utility function to parse number from text
   */
  private parseNumber(text?: string): number | undefined {
    if (!text) return undefined;

    // Remove any non-numeric characters except decimal point and minus
    const cleaned = text.replace(/[^\d.-]/g, "");
    const number = parseFloat(cleaned);

    return isNaN(number) ? undefined : number;
  }

  /**
   * Extract GST information from product text
   */
  private extractGST(productText: string): string {
    const gstMatch = productText.match(/GST\s*(\d+\.?\d*)/i);
    return gstMatch ? gstMatch[1] : "";
  }

  /**
   * Extract extra minimum information from product text
   */
  private extractExtraMinimum(productText: string): string {
    const extraMatch = productText.match(/EXTRA\s+MINIMUM\s+(\d+)/i);
    return extraMatch ? extraMatch[1] : "";
  }

  /**
   * Determine category based on product name
   */
  private determineCategory(product: string): string {
    const productLower = product.toLowerCase();

    if (productLower.includes("gold")) {
      if (productLower.includes("99.5")) return "gold_995";
      if (productLower.includes("99.50")) return "gold_995";
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

  /**
   * Get cached rates from localStorage
   */
  getCachedRates(): NarnoliRatesData | null {
    try {
      const cached = localStorage.getItem("narnoli_rates");
      if (cached) {
        const data = JSON.parse(cached);
        // Check if data is less than 5 minutes old
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (new Date(data.lastFetched) > fiveMinutesAgo) {
          return data;
        }
      }
    } catch (error) {
      console.error("Error reading cached rates:", error);
    }
    return null;
  }

  /**
   * Cache rates to localStorage
   */
  cacheRates(data: NarnoliRatesData): void {
    try {
      localStorage.setItem("narnoli_rates", JSON.stringify(data));
    } catch (error) {
      console.error("Error caching rates:", error);
    }
  }

  /**
   * Get rates with caching
   */
  async getRatesWithCache(): Promise<NarnoliRatesData> {
    // Try to get cached data first
    const cached = this.getCachedRates();
    if (cached) {
      return cached;
    }

    // Fetch fresh data
    const freshData = await this.fetchLiveRates();

    // Cache the fresh data
    if (freshData.status === "success") {
      this.cacheRates(freshData);
    }

    return freshData;
  }
}

export const narnoliCorporationService = new NarnoliCorporationService();

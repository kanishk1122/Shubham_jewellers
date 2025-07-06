import puppeteer, { Browser, Page } from "puppeteer";

export interface NarnoliMetalRate {
  metal: string;
  rate: number;
  unit: string;
  timestamp: Date;
  source?: string;
  productDetails?: string;
}

export interface NarnoliScrapingResult {
  success: boolean;
  rates: NarnoliMetalRate[];
  error?: string;
  debugInfo?: {
    pageTitle: string;
    url: string;
    loadTime: number;
    elementsFound: number;
    htmlLength: number;
    screenshot?: string;
  };
}

export class PuppeteerNarnoliScraper {
  private browser: Browser | null = null;
  private readonly baseUrls = [
    "http://narnolicorporation.in/",
    "https://narnolicorporation.in/",
    "http://www.narnolicorporation.in/",
    "https://www.narnolicorporation.in/",
  ];
  private readonly timeout = 30000; // 30 seconds
  private readonly userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  async initialize(): Promise<void> {
    if (this.browser) {
      return;
    }

    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--disable-gpu",
          "--disable-web-security",
          "--disable-features=site-per-process",
          "--disable-extensions",
          "--disable-plugins",
          "--disable-default-apps",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
          "--disable-field-trial-config",
          "--disable-back-forward-cache",
          "--disable-ipc-flooding-protection",
          "--allow-running-insecure-content",
          "--ignore-certificate-errors",
          "--ignore-ssl-errors",
          "--ignore-certificate-errors-spki-list",
        ],
        timeout: this.timeout,
      });
    } catch (error) {
      throw new Error(`Failed to launch Puppeteer: ${error}`);
    }
  }

  async scrapeMetalRates(): Promise<NarnoliScrapingResult> {
    const startTime = Date.now();
    let page: Page | null = null;

    try {
      await this.initialize();

      if (!this.browser) {
        throw new Error("Browser not initialized");
      }

      page = await this.browser.newPage();
      await page.setUserAgent(this.userAgent);

      // Set extra HTTP headers to appear more like a regular browser
      await page.setExtraHTTPHeaders({
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        DNT: "1",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Cache-Control": "max-age=0",
      });

      // Set viewport
      await page.setViewport({ width: 1920, height: 1080 });

      // Disable request interception initially to avoid blocking issues
      // We'll re-enable it after the initial page load if needed
      console.log("Navigating to Narnoli Corporation...");

      // Navigate to the page with multiple retry attempts and URLs
      let navigationSuccess = false;
      let lastError: Error | null = null;
      let successfulUrl = "";

      for (const url of this.baseUrls) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            console.log(`Trying ${url} (attempt ${attempt}/2)...`);

            // First try standard navigation
            await page.goto(url, {
              waitUntil: "networkidle0",
              timeout: this.timeout,
            });

            navigationSuccess = true;
            successfulUrl = url;
            console.log(`Successfully loaded: ${url}`);
            break;
          } catch (error) {
            lastError = error as Error;
            console.log(
              `Standard navigation failed for ${url} (attempt ${attempt}):`,
              error
            );

            // If it's a blocked error, try alternative navigation
            if (this.isBlockedError(lastError)) {
              console.log(
                "Detected blocking error, trying alternative navigation..."
              );
              try {
                const alternativeSuccess = await this.tryAlternativeNavigation(
                  page,
                  url
                );
                if (alternativeSuccess) {
                  navigationSuccess = true;
                  successfulUrl = url;
                  console.log(`Alternative navigation succeeded for: ${url}`);
                  break;
                }
              } catch (altError) {
                console.log("Alternative navigation also failed:", altError);
              }
            }

            if (attempt < 2) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }
        }

        if (navigationSuccess) break;
      }

      if (!navigationSuccess) {
        throw new Error(
          `Failed to navigate after 3 attempts: ${lastError?.message}`
        );
      }

      // Wait for React to load and render
      console.log("Waiting for content to load...");
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Give React time to render

      // Try to wait for specific elements that might contain rates
      try {
        await page.waitForSelector(
          'table, .rate, .price, [class*="rate"], [class*="price"], [class*="gold"], [class*="silver"]',
          {
            timeout: 10000,
          }
        );
      } catch (e) {
        console.log(
          "No rate-specific selectors found, proceeding with general scraping..."
        );
      }

      const pageTitle = await page.title();
      const url = page.url();
      const htmlContent = await page.content();

      console.log(`Page loaded: ${pageTitle}`);
      console.log(`HTML length: ${htmlContent.length}`);

      // Take a screenshot for debugging
      const screenshot = await page.screenshot({
        encoding: "base64",
        fullPage: true,
      });

      // Try multiple strategies to extract rates
      const rates = await this.extractRatesFromPage(page);

      const loadTime = Date.now() - startTime;

      return {
        success: rates.length > 0,
        rates,
        debugInfo: {
          pageTitle,
          url,
          loadTime,
          elementsFound: rates.length,
          htmlLength: htmlContent.length,
          screenshot: `data:image/png;base64,${screenshot}`,
        },
      };
    } catch (error) {
      const loadTime = Date.now() - startTime;
      console.error("Puppeteer scraping error:", error);

      return {
        success: false,
        rates: [],
        error: error instanceof Error ? error.message : "Unknown error",
        debugInfo: {
          pageTitle: "Error",
          url: this.baseUrls[0],
          loadTime,
          elementsFound: 0,
          htmlLength: 0,
        },
      };
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  private async extractRatesFromPage(page: Page): Promise<NarnoliMetalRate[]> {
    const rates: NarnoliMetalRate[] = [];

    try {
      // Strategy 1: Target specific Narnoli Corporation table rows
      const specificRates = await page.evaluate(() => {
        const extractedRates: any[] = [];

        // Look for tables with the specific structure
        const tables = document.querySelectorAll("table");

        tables.forEach((table) => {
          const rows = table.querySelectorAll("tr");

          rows.forEach((row, rowIndex) => {
            const cells = row.querySelectorAll("td");
            if (cells.length >= 4) {
              const productText = cells[0]?.textContent?.trim() || "";
              const sellText = cells[3]?.textContent?.trim() || "";

              console.log(
                `Row ${rowIndex}: "${productText}" -> SELL: "${sellText}"`
              );

              // Target specific gold rate: (2) GOLD 99.50 (1kg) TO 600 GRAM INDIAN - BIS T+0
              // More flexible matching for gold rate
              if (
                (productText.includes("(2)") ||
                  productText.match(/^\s*2[\s)]/)) &&
                productText.toUpperCase().includes("GOLD") &&
                (productText.includes("99.50") ||
                  productText.includes("99.5")) &&
                (productText.includes("600") || productText.includes("1kg")) &&
                productText.toUpperCase().includes("INDIAN") &&
                productText.toUpperCase().includes("BIS")
              ) {
                // Extract only the first valid number from SELL column (avoid concatenation)
                const sellMatch = sellText.match(/\b(\d{5,6})\b/); // Match 5-6 digit numbers (like 99675)
                const sellValue = sellMatch ? parseFloat(sellMatch[1]) : 0;
                console.log(
                  `Found Gold rate: ${sellValue} from "${sellText}" (original: ${sellText.replace(
                    /[^\d.]/g,
                    ""
                  )})`
                );
                if (sellValue > 50000 && sellValue < 200000) {
                  // Reasonable range check for gold
                  extractedRates.push({
                    metal: "Gold",
                    rate: sellValue,
                    unit: "per 10 grams",
                    source: "narnoli-specific-gold",
                    productDetails: productText,
                  });
                }
              }

              // Target specific silver rate: (6) SILVER 999 AUCTION GST EXTRA MINIMUM 5kg BOOK
              // More flexible matching for silver rate
              if (
                (productText.includes("(6)") ||
                  productText.match(/^\s*6[\s)]/)) &&
                productText.toUpperCase().includes("SILVER") &&
                (productText.includes("999") || productText.includes("99.9")) &&
                productText.toUpperCase().includes("AUCTION") &&
                productText.includes("5kg") &&
                productText.toUpperCase().includes("BOOK")
              ) {
                // Extract only the first valid number from SELL column (avoid concatenation)
                const sellMatch = sellText.match(/\b(\d{5,7})\b/); // Match 5-7 digit numbers (like 109000)
                const sellValue = sellMatch ? parseFloat(sellMatch[1]) : 0;
                console.log(
                  `Found Silver rate: ${sellValue} from "${sellText}" (original: ${sellText.replace(
                    /[^\d.]/g,
                    ""
                  )})`
                );
                if (sellValue > 50000 && sellValue < 500000) {
                  // Reasonable range check for silver per kg
                  extractedRates.push({
                    metal: "Silver",
                    rate: sellValue,
                    unit: "per kg",
                    source: "narnoli-specific-silver",
                    productDetails: productText,
                  });
                }
              }
            }
          });
        });

        return extractedRates;
      });

      // Add the specific rates first (priority)
      specificRates.forEach((rate) => {
        rates.push({
          ...rate,
          timestamp: new Date(),
        });
      });

      // Strategy 2: Fallback - Look for any table with rate data patterns
      if (rates.length === 0) {
        const fallbackRates = await page.evaluate(() => {
          const tables = document.querySelectorAll("table");
          const extractedRates: any[] = [];

          tables.forEach((table) => {
            const rows = table.querySelectorAll("tr");
            rows.forEach((row) => {
              const cells = row.querySelectorAll("td, th");
              if (cells.length >= 2) {
                const text = Array.from(cells)
                  .map((cell) => cell.textContent?.trim())
                  .join(" | ");

                // Look for patterns that might indicate rates
                const goldMatch = text.match(
                  /gold.*?(\d+(?:,\d+)*(?:\.\d+)?)/i
                );
                const silverMatch = text.match(
                  /silver.*?(\d+(?:,\d+)*(?:\.\d+)?)/i
                );

                if (goldMatch) {
                  const rate = parseFloat(goldMatch[1].replace(/,/g, ""));
                  if (rate > 50000 && rate < 200000) {
                    // Reasonable range for gold
                    extractedRates.push({
                      metal: "Gold",
                      rate,
                      unit: "per 10 grams",
                      source: "fallback-table",
                    });
                  }
                }

                if (silverMatch) {
                  const rate = parseFloat(silverMatch[1].replace(/,/g, ""));
                  if (rate > 50000 && rate < 200000) {
                    // Reasonable range for silver per kg
                    extractedRates.push({
                      metal: "Silver",
                      rate,
                      unit: "per kg",
                      source: "fallback-table",
                    });
                  }
                }
              }
            });
          });

          return extractedRates;
        });

        fallbackRates.forEach((rate) => {
          rates.push({
            ...rate,
            timestamp: new Date(),
          });
        });
      }

      // Strategy 3: Look for SELL column values specifically
      const sellColumnRates = await page.evaluate(() => {
        const extractedRates: any[] = [];

        // Look for table headers containing "SELL"
        const headers = document.querySelectorAll("th, td");
        let sellColumnIndex = -1;

        headers.forEach((header, index) => {
          if (header.textContent?.trim().toUpperCase() === "SELL") {
            // Find the column index relative to its row
            const row = header.closest("tr");
            if (row) {
              const cells = row.querySelectorAll("th, td");
              sellColumnIndex = Array.from(cells).indexOf(header);
            }
          }
        });

        if (sellColumnIndex >= 0) {
          const tables = document.querySelectorAll("table");
          tables.forEach((table) => {
            const rows = table.querySelectorAll("tr");
            rows.forEach((row) => {
              const cells = row.querySelectorAll("td");
              if (cells.length > sellColumnIndex && sellColumnIndex >= 0) {
                const productCell = cells[0]?.textContent?.trim() || "";
                const sellCell =
                  cells[sellColumnIndex]?.textContent?.trim() || "";

                // Extract only the first valid number to avoid concatenation
                const sellMatch = sellCell.match(/\b(\d{5,7})\b/);
                const sellValue = sellMatch ? parseFloat(sellMatch[1]) : 0;

                if (
                  sellValue > 50000 &&
                  sellValue < 200000 &&
                  productCell.toLowerCase().includes("gold")
                ) {
                  extractedRates.push({
                    metal: "Gold",
                    rate: sellValue,
                    unit: "per 10 grams",
                    source: "sell-column-gold",
                    productDetails: productCell,
                  });
                }

                if (
                  sellValue > 50000 &&
                  sellValue < 500000 &&
                  productCell.toLowerCase().includes("silver")
                ) {
                  extractedRates.push({
                    metal: "Silver",
                    rate: sellValue,
                    unit: "per kg",
                    source: "sell-column-silver",
                    productDetails: productCell,
                  });
                }
              }
            });
          });
        }

        return extractedRates;
      });

      // Add sell column rates if we don't have specific ones
      if (rates.filter((r) => r.source?.includes("specific")).length === 0) {
        sellColumnRates.forEach((rate) => {
          if (
            !rates.some((r) => r.metal === rate.metal && r.rate === rate.rate)
          ) {
            rates.push({
              ...rate,
              timestamp: new Date(),
            });
          }
        });
      }

      console.log(`Extracted ${rates.length} rates using Puppeteer`);
      console.log(
        "Rates found:",
        rates.map((r) => `${r.metal}: ₹${r.rate} (${r.source})`)
      );

      return rates;
    } catch (error) {
      console.error("Error extracting rates:", error);
      return rates;
    }
  }

  async getPageStructure(): Promise<any> {
    let page: Page | null = null;

    try {
      await this.initialize();

      if (!this.browser) {
        throw new Error("Browser not initialized");
      }

      page = await this.browser.newPage();
      await page.setUserAgent(this.userAgent);

      await page.goto(this.baseUrls[0], {
        waitUntil: "networkidle2",
        timeout: this.timeout,
      });

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const structure = await page.evaluate(() => {
        const getAllElements = (element: Element, depth = 0): any => {
          if (depth > 5) return null; // Limit recursion

          const result: any = {
            tagName: element.tagName,
            className: element.className,
            id: element.id,
            textContent: element.textContent?.slice(0, 100) || "", // Limit text
            attributes: {},
          };

          // Get all attributes
          for (let i = 0; i < element.attributes.length; i++) {
            const attr = element.attributes[i];
            result.attributes[attr.name] = attr.value;
          }

          // Get children (limited)
          const children = Array.from(element.children).slice(0, 10); // Limit children
          if (children.length > 0) {
            result.children = children
              .map((child) => getAllElements(child, depth + 1))
              .filter(Boolean);
          }

          return result;
        };

        return getAllElements(document.body);
      });

      return structure;
    } catch (error) {
      throw error;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  private isBlockedError(error: Error): boolean {
    const blockedPatterns = [
      "ERR_BLOCKED_BY_CLIENT",
      "ERR_NETWORK_ACCESS_DENIED",
      "ERR_ACCESS_DENIED",
      "ERR_BLOCKED_BY_ADMINISTRATOR",
      "ERR_BLOCKED_BY_RESPONSE",
    ];

    return blockedPatterns.some(
      (pattern) =>
        error.message.includes(pattern) || error.toString().includes(pattern)
    );
  }

  private async tryAlternativeNavigation(
    page: Page,
    url: string
  ): Promise<boolean> {
    try {
      // Try with different wait conditions
      const waitStrategies = [
        "networkidle0",
        "networkidle2",
        "domcontentloaded",
        "load",
      ] as const;

      for (const strategy of waitStrategies) {
        try {
          console.log(`Trying navigation with waitUntil: ${strategy}`);
          await page.goto(url, {
            waitUntil: strategy,
            timeout: 15000, // Shorter timeout for each attempt
          });
          return true;
        } catch (error) {
          console.log(`Wait strategy ${strategy} failed:`, error);
          continue;
        }
      }

      return false;
    } catch (error) {
      console.log("Alternative navigation failed:", error);
      return false;
    }
  }
}

// Singleton instance
let scraperInstance: PuppeteerNarnoliScraper | null = null;

export const getPuppeteerNarnoliScraper = (): PuppeteerNarnoliScraper => {
  if (!scraperInstance) {
    scraperInstance = new PuppeteerNarnoliScraper();
  }
  return scraperInstance;
};

export const scrapeLiveNarnoliRates =
  async (): Promise<NarnoliScrapingResult> => {
    const scraper = getPuppeteerNarnoliScraper();
    return await scraper.scrapeMetalRates();
  };

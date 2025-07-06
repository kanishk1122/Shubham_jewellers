import puppeteer, { Browser, Page } from "puppeteer";

export interface NarnoliMetalRate {
  metal: string;
  rate: number;
  unit: string;
  timestamp: Date;
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
  private readonly baseUrl = "http://narnolicorporation.in/";
  private readonly timeout = 30000; // 30 seconds
  private readonly userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36";

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

      // Set viewport
      await page.setViewport({ width: 1920, height: 1080 });

      // Enable request interception to block images and other resources for faster loading
      await page.setRequestInterception(true);
      page.on("request", (req) => {
        const resourceType = req.resourceType();
        if (
          resourceType === "stylesheet" ||
          resourceType === "image" ||
          resourceType === "font"
        ) {
          req.abort();
        } else {
          req.continue();
        }
      });

      console.log("Navigating to Narnoli Corporation...");

      // Navigate to the page
      await page.goto(this.baseUrl, {
        waitUntil: "networkidle2",
        timeout: this.timeout,
      });

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
          url: this.baseUrl,
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
      // Strategy 1: Look for tables with rate data
      const tableRates = await page.evaluate(() => {
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
              const goldMatch = text.match(/gold.*?(\d+(?:,\d+)*(?:\.\d+)?)/i);
              const silverMatch = text.match(
                /silver.*?(\d+(?:,\d+)*(?:\.\d+)?)/i
              );

              if (goldMatch) {
                const rate = parseFloat(goldMatch[1].replace(/,/g, ""));
                if (rate > 0) {
                  extractedRates.push({
                    metal: "Gold",
                    rate,
                    unit: "per 10 grams",
                    source: "table",
                  });
                }
              }

              if (silverMatch) {
                const rate = parseFloat(silverMatch[1].replace(/,/g, ""));
                if (rate > 0) {
                  extractedRates.push({
                    metal: "Silver",
                    rate,
                    unit: "per kg",
                    source: "table",
                  });
                }
              }
            }
          });
        });

        return extractedRates;
      });

      tableRates.forEach((rate) => {
        rates.push({
          ...rate,
          timestamp: new Date(),
        });
      });

      // Strategy 2: Look for divs or spans with rate-like content
      const divRates = await page.evaluate(() => {
        const elements = document.querySelectorAll("div, span, p");
        const extractedRates: any[] = [];

        elements.forEach((element) => {
          const text = element.textContent?.trim() || "";

          // Look for patterns like "Gold: 45,000" or "Silver Rate: 65,000"
          const patterns = [
            /gold.*?rate.*?(\d+(?:,\d+)*(?:\.\d+)?)/i,
            /(\d+(?:,\d+)*(?:\.\d+)?).*?gold/i,
            /silver.*?rate.*?(\d+(?:,\d+)*(?:\.\d+)?)/i,
            /(\d+(?:,\d+)*(?:\.\d+)?).*?silver/i,
          ];

          patterns.forEach((pattern, index) => {
            const match = text.match(pattern);
            if (match) {
              const rate = parseFloat(match[1].replace(/,/g, ""));
              if (rate > 1000 && rate < 100000) {
                // Reasonable range for metal rates
                const metal = index < 2 ? "Gold" : "Silver";
                const unit = metal === "Gold" ? "per 10 grams" : "per kg";

                extractedRates.push({
                  metal,
                  rate,
                  unit,
                  source: "div/span",
                });
              }
            }
          });
        });

        return extractedRates;
      });

      divRates.forEach((rate) => {
        // Avoid duplicates
        if (
          !rates.some((r) => r.metal === rate.metal && r.rate === rate.rate)
        ) {
          rates.push({
            ...rate,
            timestamp: new Date(),
          });
        }
      });

      // Strategy 3: Look for JSON data in script tags
      const scriptRates = await page.evaluate(() => {
        const scripts = document.querySelectorAll("script");
        const extractedRates: any[] = [];

        scripts.forEach((script) => {
          const content = script.textContent || "";

          // Look for JSON-like data
          try {
            const jsonMatches = content.match(
              /\{[^}]*(?:gold|silver|rate|price)[^}]*\}/gi
            );
            jsonMatches?.forEach((jsonStr) => {
              try {
                const data = JSON.parse(jsonStr);
                // Process JSON data for rates
                if (data.gold && typeof data.gold === "number") {
                  extractedRates.push({
                    metal: "Gold",
                    rate: data.gold,
                    unit: "per 10 grams",
                    source: "script-json",
                  });
                }
                if (data.silver && typeof data.silver === "number") {
                  extractedRates.push({
                    metal: "Silver",
                    rate: data.silver,
                    unit: "per kg",
                    source: "script-json",
                  });
                }
              } catch (e) {
                // Not valid JSON, skip
              }
            });
          } catch (e) {
            // Error parsing, skip
          }
        });

        return extractedRates;
      });

      scriptRates.forEach((rate) => {
        if (
          !rates.some((r) => r.metal === rate.metal && r.rate === rate.rate)
        ) {
          rates.push({
            ...rate,
            timestamp: new Date(),
          });
        }
      });

      console.log(`Extracted ${rates.length} rates using Puppeteer`);
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

      await page.goto(this.baseUrl, {
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

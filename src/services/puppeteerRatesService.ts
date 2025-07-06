export interface PuppeteerMetalRate {
  metal: string;
  rate: number;
  unit: string;
  timestamp: Date;
  source: "puppeteer-server";
}

export interface PuppeteerRatesResponse {
  success: boolean;
  rates: PuppeteerMetalRate[];
  error?: string;
  lastUpdated: Date;
  debugInfo?: {
    pageTitle: string;
    url: string;
    loadTime: number;
    elementsFound: number;
    htmlLength: number;
  };
}

export class PuppeteerRatesService {
  private readonly apiEndpoint = "/api/scrape-narnoli";
  private cache: PuppeteerRatesResponse | null = null;
  private lastFetch: Date | null = null;
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  async fetchLiveRates(useCache = true): Promise<PuppeteerRatesResponse> {
    // Check cache
    if (useCache && this.cache && this.lastFetch) {
      const now = new Date();
      const timeSinceLastFetch = now.getTime() - this.lastFetch.getTime();

      if (timeSinceLastFetch < this.cacheTimeout) {
        console.log("Returning cached Puppeteer rates");
        return this.cache;
      }
    }

    try {
      console.log("Fetching live rates via Puppeteer API...");

      const response = await fetch(this.apiEndpoint, {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const result: PuppeteerRatesResponse = {
        success: data.success,
        rates: data.rates.map((rate: any) => ({
          ...rate,
          timestamp: new Date(rate.timestamp),
          source: "puppeteer-server" as const,
        })),
        error: data.error,
        lastUpdated: new Date(),
        debugInfo: data.debugInfo,
      };

      // Update cache
      this.cache = result;
      this.lastFetch = new Date();

      console.log(`Puppeteer API returned ${result.rates.length} rates`);
      return result;
    } catch (error) {
      console.error("Error fetching Puppeteer rates:", error);

      const errorResult: PuppeteerRatesResponse = {
        success: false,
        rates: [],
        error: error instanceof Error ? error.message : "Unknown error",
        lastUpdated: new Date(),
      };

      return errorResult;
    }
  }

  async getPageStructure(): Promise<any> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "getStructure" }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.structure;
    } catch (error) {
      console.error("Error getting page structure:", error);
      throw error;
    }
  }

  async closeBrowser(): Promise<void> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "close" }),
      });

      if (response.ok) {
        console.log("Puppeteer browser closed successfully");
      }
    } catch (error) {
      console.error("Error closing browser:", error);
    }
  }

  clearCache(): void {
    this.cache = null;
    this.lastFetch = null;
  }

  getCachedRates(): PuppeteerRatesResponse | null {
    return this.cache;
  }

  isCacheValid(): boolean {
    if (!this.cache || !this.lastFetch) {
      return false;
    }

    const now = new Date();
    const timeSinceLastFetch = now.getTime() - this.lastFetch.getTime();
    return timeSinceLastFetch < this.cacheTimeout;
  }
}

// Singleton instance
let puppeteerRatesServiceInstance: PuppeteerRatesService | null = null;

export const getPuppeteerRatesService = (): PuppeteerRatesService => {
  if (!puppeteerRatesServiceInstance) {
    puppeteerRatesServiceInstance = new PuppeteerRatesService();
  }
  return puppeteerRatesServiceInstance;
};

// Convenience function for quick access
export const fetchPuppeteerLiveRates = async (
  useCache = true
): Promise<PuppeteerRatesResponse> => {
  const service = getPuppeteerRatesService();
  return await service.fetchLiveRates(useCache);
};

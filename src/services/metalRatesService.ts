// Live metal rates API service for Jaipur Sarafa market and Narnoli Corporation
import {
  narnoliCorporationService,
  type NarnoliRatesData,
} from "./narnolicorporationService";

export interface MetalRate {
  metal: "gold" | "silver";
  purity: string;
  rate: number;
  unit: string;
  lastUpdated: string;
  source?: "narnoli" | "jaipur" | "manual";
}

export interface MetalRatesResponse {
  success: boolean;
  data?: MetalRate[];
  error?: string;
  lastUpdated?: string;
  narnoliData?: NarnoliRatesData;
}

// Since real-time API for Jaipur Sarafa might not be freely available,
// we'll create a service that can be easily switched to real API later
export class MetalRatesService {
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static cache: { data: MetalRate[]; timestamp: number } | null = null;

  // Mock data - replace with real API call
  private static async fetchFromMockAPI(): Promise<MetalRate[]> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const now = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    });

    return [
      {
        metal: "gold",
        purity: "24K",
        rate: 6250,
        unit: "per gram",
        lastUpdated: now,
      },
      {
        metal: "gold",
        purity: "22K",
        rate: 5730,
        unit: "per gram",
        lastUpdated: now,
      },
      {
        metal: "gold",
        purity: "18K",
        rate: 4687,
        unit: "per gram",
        lastUpdated: now,
      },
      {
        metal: "silver",
        purity: "999",
        rate: 75,
        unit: "per gram",
        lastUpdated: now,
      },
      {
        metal: "silver",
        purity: "925",
        rate: 69,
        unit: "per gram",
        lastUpdated: now,
      },
    ];
  }

  // Real API implementation (to be implemented when API is available)
  private static async fetchFromRealAPI(): Promise<MetalRate[]> {
    try {
      // First try to get data from Narnoli Corporation
      const narnoliData = await narnoliCorporationService.getRatesWithCache();

      if (narnoliData.status === "success") {
        return this.parseNarnoliData(narnoliData);
      }

      // If Narnoli fails, try Jaipur Sarafa API
      const response = await fetch("https://api.jaipursarafa.com/rates", {
        headers: {
          Accept: "application/json",
          "User-Agent": "ShubhamJewellers/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseAPIResponse(data);
    } catch (error) {
      console.warn("All APIs failed, falling back to mock data:", error);
      return this.fetchFromMockAPI();
    }
  }

  // Parse Narnoli Corporation data into MetalRate format
  private static parseNarnoliData(narnoliData: NarnoliRatesData): MetalRate[] {
    const rates: MetalRate[] = [];

    // Process market rates
    narnoliData.marketRates.forEach((rate) => {
      if (rate.product.toLowerCase().includes("gold")) {
        // Determine purity from product name
        let purity = "22K"; // default
        if (rate.product.includes("99.5")) purity = "99.5%";
        else if (rate.product.includes("24K") || rate.product.includes("24"))
          purity = "24K";
        else if (rate.product.includes("22K") || rate.product.includes("22"))
          purity = "22K";
        else if (rate.product.includes("18K") || rate.product.includes("18"))
          purity = "18K";

        rates.push({
          metal: "gold",
          purity,
          rate: rate.ask || rate.bid || 0,
          unit: "per gram",
          lastUpdated: rate.lastUpdated,
          source: "narnoli",
        });
      } else if (rate.product.toLowerCase().includes("silver")) {
        let purity = "925"; // default
        if (rate.product.includes("999")) purity = "999";
        else if (rate.product.includes("925")) purity = "925";

        rates.push({
          metal: "silver",
          purity,
          rate: rate.ask || rate.bid || 0,
          unit: "per gram",
          lastUpdated: rate.lastUpdated,
          source: "narnoli",
        });
      }
    });

    // Process gold auction rates
    narnoliData.goldAuctionRates.forEach((rate) => {
      rates.push({
        metal: "gold",
        purity: rate.gst ? `${rate.gst}K` : "22K",
        rate: rate.sell,
        unit: "per gram",
        lastUpdated: rate.lastUpdated,
        source: "narnoli",
      });
    });

    // Process spot rates
    narnoliData.spotRates.forEach((rate) => {
      if (rate.product.toLowerCase().includes("gold")) {
        rates.push({
          metal: "gold",
          purity: "Spot",
          rate: (rate.bid + rate.ask) / 2, // Average of bid and ask
          unit: "per gram",
          lastUpdated: rate.lastUpdated,
          source: "narnoli",
        });
      } else if (rate.product.toLowerCase().includes("silver")) {
        rates.push({
          metal: "silver",
          purity: "Spot",
          rate: (rate.bid + rate.ask) / 2,
          unit: "per gram",
          lastUpdated: rate.lastUpdated,
          source: "narnoli",
        });
      }
    });

    return rates;
  }

  private static parseAPIResponse(data: any): MetalRate[] {
    // Parse the real API response format
    // This will need to be implemented based on actual API structure
    return data.rates || [];
  }

  public static async getCurrentRates(
    forceRefresh = false
  ): Promise<MetalRatesResponse> {
    try {
      const now = Date.now();

      // Check cache
      if (
        !forceRefresh &&
        this.cache &&
        now - this.cache.timestamp < this.CACHE_DURATION
      ) {
        return {
          success: true,
          data: this.cache.data,
          lastUpdated: new Date(this.cache.timestamp).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
          }),
        };
      }

      // Fetch new data - try real API first, fallback to mock
      const rates = await this.fetchFromRealAPI();

      // Also get Narnoli data for additional context
      const narnoliData = await narnoliCorporationService.getRatesWithCache();

      // Update cache
      this.cache = {
        data: rates,
        timestamp: now,
      };

      return {
        success: true,
        data: rates,
        narnoliData,
        lastUpdated: new Date(now).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        }),
      };
    } catch (error) {
      console.error("Failed to fetch metal rates:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  public static async getGoldRate(
    purity: "24K" | "22K" | "18K" = "22K"
  ): Promise<number | null> {
    const response = await this.getCurrentRates();
    if (!response.success || !response.data) return null;

    const goldRate = response.data.find(
      (rate) => rate.metal === "gold" && rate.purity === purity
    );
    return goldRate?.rate || null;
  }

  public static async getSilverRate(
    purity: "999" | "925" = "925"
  ): Promise<number | null> {
    const response = await this.getCurrentRates();
    if (!response.success || !response.data) return null;

    const silverRate = response.data.find(
      (rate) => rate.metal === "silver" && rate.purity === purity
    );
    return silverRate?.rate || null;
  }

  public static clearCache(): void {
    this.cache = null;
  }
}

// Hook for using metal rates in React components
export function useMetalRates() {
  const [rates, setRates] = React.useState<MetalRatesResponse>({
    success: false,
  });
  const [loading, setLoading] = React.useState(false);

  const fetchRates = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const response = await MetalRatesService.getCurrentRates(forceRefresh);
      setRates(response);
    } catch (error) {
      setRates({
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch rates",
      });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchRates();
  }, []);

  return {
    rates: rates.data || [],
    loading,
    error: rates.error,
    lastUpdated: rates.lastUpdated,
    refreshRates: () => fetchRates(true),
    success: rates.success,
  };
}

import React from "react";

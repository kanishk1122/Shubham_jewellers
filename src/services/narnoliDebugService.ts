"use client";

import { narnoliCorporationService } from "@/services/narnolicorporationService";

export interface DebugInfo {
  timestamp: string;
  url: string;
  htmlLength: number;
  tablesFound: number;
  rowsFound: number;
  goldAuctionRates: number;
  marketRates: number;
  spotRates: number;
  errors: string[];
  rawHTML?: string;
  parsedData?: any;
}

class NarnoliDebugService {
  private debugHistory: DebugInfo[] = [];

  async debugFetch(): Promise<DebugInfo> {
    const debugInfo: DebugInfo = {
      timestamp: new Date().toISOString(),
      url: "http://narnolicorporation.in",
      htmlLength: 0,
      tablesFound: 0,
      rowsFound: 0,
      goldAuctionRates: 0,
      marketRates: 0,
      spotRates: 0,
      errors: [],
    };

    try {
      console.log("🔍 Starting debug fetch from Narnoli Corporation...");

      // Fetch HTML content
      const corsProxy = "https://api.allorigins.win/raw?url=";
      const response = await fetch(
        `${corsProxy}${encodeURIComponent(debugInfo.url)}`
      );

      if (!response.ok) {
        debugInfo.errors.push(`HTTP error! status: ${response.status}`);
        return debugInfo;
      }

      const html = await response.text();
      debugInfo.htmlLength = html.length;
      debugInfo.rawHTML = html.substring(0, 2000); // First 2000 chars for debugging

      console.log(`📄 HTML fetched: ${debugInfo.htmlLength} characters`);

      // Parse HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // Count tables and rows
      const tables = doc.querySelectorAll("table");
      debugInfo.tablesFound = tables.length;

      let totalRows = 0;
      tables.forEach((table) => {
        const rows = table.querySelectorAll("tr");
        totalRows += rows.length;
      });
      debugInfo.rowsFound = totalRows;

      console.log(
        `📊 Found ${debugInfo.tablesFound} tables with ${debugInfo.rowsFound} total rows`
      );

      // Log table structures
      tables.forEach((table, index) => {
        console.log(`📋 Table ${index + 1}:`);
        const rows = table.querySelectorAll("tr");
        rows.forEach((row, rowIndex) => {
          const cells = row.querySelectorAll("td, th");
          const cellContents = Array.from(cells).map(
            (cell) => cell.textContent?.trim().substring(0, 50) || ""
          );
          console.log(`  Row ${rowIndex + 1}: [${cellContents.join(" | ")}]`);
        });
      });

      // Try to parse rates using the service
      const ratesData = await narnoliCorporationService.fetchLiveRates();
      debugInfo.parsedData = ratesData;

      if (ratesData.status === "success") {
        debugInfo.goldAuctionRates = ratesData.goldAuctionRates.length;
        debugInfo.marketRates = ratesData.marketRates.length;
        debugInfo.spotRates = ratesData.spotRates.length;

        console.log(`✅ Successfully parsed:`);
        console.log(`  - Gold Auction Rates: ${debugInfo.goldAuctionRates}`);
        console.log(`  - Market Rates: ${debugInfo.marketRates}`);
        console.log(`  - Spot Rates: ${debugInfo.spotRates}`);

        // Log sample data
        if (ratesData.goldAuctionRates.length > 0) {
          console.log(
            `🥇 Sample Gold Auction Rate:`,
            ratesData.goldAuctionRates[0]
          );
        }
        if (ratesData.marketRates.length > 0) {
          console.log(`📈 Sample Market Rate:`, ratesData.marketRates[0]);
        }
        if (ratesData.spotRates.length > 0) {
          console.log(`💰 Sample Spot Rate:`, ratesData.spotRates[0]);
        }
      } else {
        debugInfo.errors.push(ratesData.message || "Failed to parse rates");
      }

      // Look for specific patterns in the HTML
      this.analyzeHTMLPatterns(html, debugInfo);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      debugInfo.errors.push(errorMsg);
      console.error("❌ Debug fetch failed:", error);
    }

    this.debugHistory.push(debugInfo);
    return debugInfo;
  }

  private analyzeHTMLPatterns(html: string, debugInfo: DebugInfo) {
    console.log("🔍 Analyzing HTML patterns...");

    // Look for common rate-related keywords
    const keywords = [
      "gold",
      "silver",
      "rate",
      "price",
      "auction",
      "spot",
      "bid",
      "ask",
    ];
    const patterns: { [key: string]: number } = {};

    keywords.forEach((keyword) => {
      const regex = new RegExp(keyword, "gi");
      const matches = html.match(regex);
      patterns[keyword] = matches ? matches.length : 0;
    });

    console.log("📝 Keyword frequency:", patterns);

    // Look for table-like structures
    const tablePatterns = [
      /<table[^>]*>/gi,
      /<tr[^>]*>/gi,
      /<td[^>]*>/gi,
      /<th[^>]*>/gi,
      /class="[^"]*table[^"]*"/gi,
      /border="?\d+"?/gi,
    ];

    tablePatterns.forEach((pattern, index) => {
      const matches = html.match(pattern);
      console.log(
        `🏗️  Pattern ${index + 1}: ${matches ? matches.length : 0} matches`
      );
    });

    // Look for number patterns that might be rates
    const numberPattern = /\d{3,6}/g;
    const numbers = html.match(numberPattern);
    if (numbers) {
      const uniqueNumbers = [...new Set(numbers)].sort(
        (a, b) => parseInt(b) - parseInt(a)
      );
      console.log("🔢 Large numbers found:", uniqueNumbers.slice(0, 10));
    }
  }

  getDebugHistory(): DebugInfo[] {
    return this.debugHistory;
  }

  clearDebugHistory(): void {
    this.debugHistory = [];
  }

  generateDebugReport(): string {
    const latest = this.debugHistory[this.debugHistory.length - 1];
    if (!latest) return "No debug data available";

    return `
# Narnoli Corporation Debug Report

**Timestamp:** ${latest.timestamp}
**URL:** ${latest.url}
**HTML Length:** ${latest.htmlLength} characters
**Tables Found:** ${latest.tablesFound}
**Rows Found:** ${latest.rowsFound}

## Parsing Results
- Gold Auction Rates: ${latest.goldAuctionRates}
- Market Rates: ${latest.marketRates}
- Spot Rates: ${latest.spotRates}

## Errors
${
  latest.errors.length > 0
    ? latest.errors.map((e) => `- ${e}`).join("\n")
    : "None"
}

## HTML Sample
\`\`\`
${latest.rawHTML?.substring(0, 500) || "Not available"}...
\`\`\`

## Recommendations
${this.generateRecommendations(latest)}
    `.trim();
  }

  private generateRecommendations(debugInfo: DebugInfo): string {
    const recommendations = [];

    if (debugInfo.htmlLength === 0) {
      recommendations.push("- Check network connectivity and CORS proxy");
    }

    if (debugInfo.tablesFound === 0) {
      recommendations.push(
        "- Website structure may have changed - tables not found"
      );
      recommendations.push("- Try alternative selectors (div, span, etc.)");
    }

    if (debugInfo.tablesFound > 0 && debugInfo.goldAuctionRates === 0) {
      recommendations.push("- Tables found but no gold auction rates parsed");
      recommendations.push("- Check table structure and parsing logic");
    }

    if (debugInfo.errors.length > 0) {
      recommendations.push("- Review errors and adjust parsing strategy");
    }

    if (recommendations.length === 0) {
      recommendations.push("- Data fetching appears to be working correctly");
    }

    return recommendations.join("\n");
  }
}

export const narnoliDebugService = new NarnoliDebugService();

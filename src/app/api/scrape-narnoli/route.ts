import { NextRequest, NextResponse } from "next/server";
import { getPuppeteerNarnoliScraper } from "../../../services/puppeteerNarnoliScraper";

export async function GET(request: NextRequest) {
  try {
    console.log("Starting Puppeteer scraping of Narnoli Corporation...");

    const scraper = getPuppeteerNarnoliScraper();
    const result = await scraper.scrapeMetalRates();

    console.log(
      `Scraping completed. Success: ${result.success}, Rates found: ${result.rates.length}`
    );

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("API scraping error:", error);

    return NextResponse.json(
      {
        success: false,
        rates: [],
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        debugInfo: {
          pageTitle: "Error",
          url: "http://narnolicorporation.in/",
          loadTime: 0,
          elementsFound: 0,
          htmlLength: 0,
        },
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "getStructure") {
      console.log("Getting page structure with Puppeteer...");

      const scraper = getPuppeteerNarnoliScraper();
      const structure = await scraper.getPageStructure();

      return NextResponse.json({
        success: true,
        structure,
      });
    }

    if (action === "close") {
      console.log("Closing Puppeteer browser...");

      const scraper = getPuppeteerNarnoliScraper();
      await scraper.close();

      return NextResponse.json({
        success: true,
        message: "Browser closed successfully",
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Invalid action",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error("API POST error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      {
        status: 500,
      }
    );
  }
}

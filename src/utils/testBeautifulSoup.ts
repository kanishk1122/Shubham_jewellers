/**
 * Test script for Beautiful Soup TypeScript functionality
 *
 * This script demonstrates how to use the Beautiful Soup-like
 * web scraping library in TypeScript for extracting financial data.
 */

import {
  BeautifulSoupTS,
  beautifulSoupService,
} from "../services/beautifulSoupTS";

// ===== BASIC BEAUTIFUL SOUP FUNCTIONALITY TESTS =====

export function testBasicBeautifulSoupFunctionality() {
  console.log("🧪 Testing Basic Beautiful Soup TypeScript Functionality");

  // Sample HTML for testing
  const sampleHTML = `
    <html>
      <head><title>Test Financial Data</title></head>
      <body>
        <div class="rates-container">
          <table class="gold-rates">
            <tr>
              <th>Product</th>
              <th>Rate</th>
              <th>Change</th>
            </tr>
            <tr>
              <td>Gold 99.5% Auction</td>
              <td>₹75,450 per gram</td>
              <td>+2.5%</td>
            </tr>
            <tr>
              <td>Silver 999</td>
              <td>₹925.50 per gram</td>
              <td>-1.2%</td>
            </tr>
          </table>
          
          <div class="spot-rates">
            <p>Gold Spot: $2,150.00</p>
            <p>Silver Spot: $28.75</p>
          </div>
          
          <div class="market-info">
            <span class="price">Current Gold: ₹76,000</span>
            <span class="high">High: ₹76,500</span>
            <span class="low">Low: ₹75,200</span>
          </div>
        </div>
      </body>
    </html>
  `;

  // Create Beautiful Soup parser
  const soup = new BeautifulSoupTS(sampleHTML);

  console.log("📄 Document Title:", soup.title);

  // Test finding elements
  console.log("\n🔍 Testing Element Finding:");

  const table = soup.find("table.gold-rates");
  console.log("   Found table:", table ? "✅" : "❌");

  const allTables = soup.findAll("table");
  console.log("   Found tables count:", allTables.length);

  const rateElements = soup.findByText("rate", false);
  console.log("   Elements containing 'rate':", rateElements.length);

  // Test number and price extraction
  console.log("\n💰 Testing Financial Data Extraction:");

  const allNumbers = soup.extractAllNumbers();
  console.log("   All numbers found:", allNumbers);

  const allPrices = soup.extractAllPrices();
  console.log("   All prices found:", allPrices);

  // Test table data extraction
  console.log("\n📊 Testing Table Data Extraction:");

  if (table) {
    const tableData = soup.extractTableData(table);
    console.log("   Table rows:", tableData.length);

    tableData.forEach((row, index) => {
      console.log(
        `   Row ${index}:`,
        row.map((cell) => ({
          text: cell.text,
          numbers: cell.numbers,
          prices: cell.prices,
        }))
      );
    });
  }

  // Test specific element methods
  console.log("\n🎯 Testing Specific Element Methods:");

  const goldRow = soup.findByText("Gold 99.5%")[0];
  if (goldRow) {
    console.log("   Gold row found:", goldRow.text);
    console.log("   Numbers in gold row:", goldRow.extractNumbers());
    console.log("   Prices in gold row:", goldRow.extractPrices());
    console.log("   Table position:", goldRow.getTablePosition());
  }

  console.log("\n✅ Basic Beautiful Soup test completed!\n");
}

// ===== LIVE NARNOLI SCRAPING TESTS =====

export async function testLiveNarnoliScraping() {
  console.log("🕷️ Testing Live Narnoli Corporation Scraping");

  try {
    const result = await beautifulSoupService.scrapeNarnoliRates();

    console.log("📊 Scraping Results:");
    console.log("   Success:", result.success);
    console.log("   Elements Found:", result.metadata.elementsFound);
    console.log("   Processing Time:", result.metadata.processingTime + "ms");
    console.log("   Errors:", result.metadata.errors.length);

    if (result.success && result.data.length > 0) {
      console.log("\n💰 Sample Extracted Rates:");

      result.data.slice(0, 3).forEach((rate: any, index: number) => {
        console.log(`   Rate ${index + 1}:`, {
          symbol: rate.symbol,
          name: rate.name.substring(0, 30) + "...",
          price: rate.price,
          source: rate.source,
        });
      });

      // Group rates by type
      const ratesByType = result.data.reduce((acc: any, rate: any) => {
        const type = rate.metadata?.rateType || "unknown";
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      console.log("\n📈 Rates by Type:", ratesByType);
    }

    if (result.metadata.errors.length > 0) {
      console.log("\n❌ Errors encountered:");
      result.metadata.errors.forEach((error) => console.log("   -", error));
    }
  } catch (error) {
    console.error("❌ Live scraping test failed:", error);
  }

  console.log("\n✅ Live Narnoli scraping test completed!\n");
}

// ===== CACHING TESTS =====

export async function testCachingFunctionality() {
  console.log("📦 Testing Caching Functionality");

  // Test fresh scraping
  console.log("🔄 Testing fresh scraping...");
  const startTime = Date.now();
  const freshResult = await beautifulSoupService.scrapeNarnoliRates();
  const freshTime = Date.now() - startTime;

  console.log("   Fresh scraping time:", freshTime + "ms");
  console.log("   Fresh result success:", freshResult.success);

  // Test cached scraping
  console.log("\n📦 Testing cached scraping...");
  const cachedStartTime = Date.now();
  const cachedResult = await beautifulSoupService.scrapeWithCache();
  const cachedTime = Date.now() - cachedStartTime;

  console.log("   Cached scraping time:", cachedTime + "ms");
  console.log("   Cached result success:", cachedResult.success);
  console.log(
    "   Speed improvement:",
    Math.round((freshTime / cachedTime) * 100) / 100 + "x faster"
  );

  console.log("\n✅ Caching test completed!\n");
}

// ===== COMPREHENSIVE TEST SUITE =====

export async function runComprehensiveBeautifulSoupTests() {
  console.log("🚀 Running Comprehensive Beautiful Soup TypeScript Tests\n");

  // Run basic functionality tests
  testBasicBeautifulSoupFunctionality();

  // Run live scraping tests
  await testLiveNarnoliScraping();

  // Run caching tests
  await testCachingFunctionality();

  console.log("🎉 All Beautiful Soup TypeScript tests completed!");
  console.log("📝 Check the browser console for detailed results.");
}

// ===== EXPORT FOR USE IN COMPONENTS =====

export const BeautifulSoupTestUtils = {
  testBasicFunctionality: testBasicBeautifulSoupFunctionality,
  testLiveScraping: testLiveNarnoliScraping,
  testCaching: testCachingFunctionality,
  runAllTests: runComprehensiveBeautifulSoupTests,
};

// ===== DEMO HTML FOR TESTING =====

export const demoHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>Narnoli Corporation - Live Metal Rates</title>
</head>
<body>
    <div class="container">
        <h1>Today's Metal Rates</h1>
        
        <!-- Gold Auction Rates -->
        <table class="auction-rates">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>M-Rate</th>
                    <th>Premium</th>
                    <th>Sell Rate</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Gold 99.50% GST Extra Minimum 200</td>
                    <td>75,200</td>
                    <td>250</td>
                    <td>75,450</td>
                </tr>
                <tr>
                    <td>Gold 99.99% Auction</td>
                    <td>75,800</td>
                    <td>300</td>
                    <td>76,100</td>
                </tr>
            </tbody>
        </table>
        
        <!-- Market Rates -->
        <table class="market-rates">
            <thead>
                <tr>
                    <th>Metal</th>
                    <th>Bid</th>
                    <th>Ask</th>
                    <th>High</th>
                    <th>Low</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Gold Current 999</td>
                    <td>75,000</td>
                    <td>75,500</td>
                    <td>76,000</td>
                    <td>74,800</td>
                </tr>
                <tr>
                    <td>Silver 999</td>
                    <td>920</td>
                    <td>930</td>
                    <td>940</td>
                    <td>915</td>
                </tr>
            </tbody>
        </table>
        
        <!-- Spot Rates -->
        <div class="spot-rates">
            <p>Gold Spot International: $2,150.00 per ounce</p>
            <p>Silver Spot International: $28.75 per ounce</p>
            <p>Gold Spot INR: ₹75,800 per 10 grams</p>
        </div>
        
        <!-- Additional Price Information -->
        <div class="price-info">
            <span class="current-gold">Current Gold: ₹75,450/gram</span>
            <span class="current-silver">Current Silver: ₹925/gram</span>
            <span class="change gold-change">Gold Change: +1.2%</span>
            <span class="change silver-change">Silver Change: -0.8%</span>
        </div>
    </div>
</body>
</html>
`;

// Example usage function for components
export function demonstrateBeautifulSoupUsage() {
  console.log("🍲 Beautiful Soup TypeScript Usage Demo");

  const soup = new BeautifulSoupTS(demoHTML);

  console.log("Finding gold auction rates:");
  const auctionTable = soup.find("table.auction-rates");
  if (auctionTable) {
    const rows = auctionTable.findAll("tr");
    rows.slice(1).forEach((row, index) => {
      // Skip header
      const cells = row.findAll("td");
      if (cells.length >= 4) {
        console.log(`Gold Rate ${index + 1}:`, {
          product: cells[0].text,
          mRate: cells[1].extractNumbers()[0],
          premium: cells[2].extractNumbers()[0],
          sellRate: cells[3].extractNumbers()[0],
        });
      }
    });
  }

  console.log("\nFinding spot rates:");
  const spotElements = soup.findByText("spot", false);
  spotElements.forEach((element) => {
    const prices = element.extractPrices();
    if (prices.length > 0) {
      console.log(`Spot Rate: ${element.text} - Price: ${prices[0]}`);
    }
  });
}

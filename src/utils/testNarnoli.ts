// Test script to demonstrate Narnoli Corporation service functionality
import { narnoliCorporationService } from "../services/narnolicorporationService";

export async function testNarnoliService() {
  console.log("🔍 Testing Narnoli Corporation Service...");

  try {
    // Test fetching live rates
    console.log("📡 Fetching live rates from Narnoli Corporation...");
    const liveRates = await narnoliCorporationService.fetchLiveRates();

    console.log("✅ Status:", liveRates.status);
    console.log("📊 Gold Auction Rates:", liveRates.goldAuctionRates.length);
    console.log("📈 Market Rates:", liveRates.marketRates.length);
    console.log("💰 Spot Rates:", liveRates.spotRates.length);

    if (liveRates.status === "success") {
      console.log("\n🥇 Sample Gold Auction Rate:");
      if (liveRates.goldAuctionRates.length > 0) {
        const sample = liveRates.goldAuctionRates[0];
        console.log(`   Product: ${sample.product}`);
        console.log(`   M-Rate: ${sample.mRate}`);
        console.log(`   Premium: ${sample.premium}`);
        console.log(`   Sell: ${sample.sell}`);
      }

      console.log("\n📈 Sample Market Rate:");
      if (liveRates.marketRates.length > 0) {
        const sample = liveRates.marketRates[0];
        console.log(`   Product: ${sample.product}`);
        console.log(`   Category: ${sample.category}`);
        console.log(`   Bid: ${sample.bid || "N/A"}`);
        console.log(`   Ask: ${sample.ask || "N/A"}`);
      }

      console.log("\n💰 Sample Spot Rate:");
      if (liveRates.spotRates.length > 0) {
        const sample = liveRates.spotRates[0];
        console.log(`   Product: ${sample.product}`);
        console.log(`   Bid: ${sample.bid}`);
        console.log(`   Ask: ${sample.ask}`);
        console.log(`   High: ${sample.high}`);
        console.log(`   Low: ${sample.low}`);
      }
    } else {
      console.log("❌ Error:", liveRates.message);
    }

    // Test caching functionality
    console.log("\n💾 Testing cache functionality...");
    const cachedRates = await narnoliCorporationService.getRatesWithCache();
    console.log("✅ Cache test completed");

    return {
      success: liveRates.status === "success",
      data: liveRates,
      cached: cachedRates,
    };
  } catch (error) {
    console.error("❌ Test failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Example usage in browser console:
// import('./utils/testNarnoli').then(m => m.testNarnoliService());

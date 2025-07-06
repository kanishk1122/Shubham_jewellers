"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/enhanced";
import {
  enhancedNarnoliService,
  type NarnoliScrapedRates,
} from "@/services/enhancedNarnoliScraper";

export const EnhancedQuickRatesWidget: React.FC = () => {
  const [rates, setRates] = useState<NarnoliScrapedRates | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRates();

    // Refresh rates every 5 minutes
    const interval = setInterval(loadRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadRates = async () => {
    try {
      console.log("🔄 Loading rates with enhanced scraper...");
      const data = await enhancedNarnoliService.getRatesWithCache();
      setRates(data);
      console.log("✅ Rates loaded:", data);
    } catch (error) {
      console.error("Failed to load rates:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-IN").format(Math.round(value));
  };

  const getKeyRates = () => {
    if (!rates || rates.status === "error") return [];

    const keyRates = [];

    // Get Gold Auction rate (highest priority)
    const goldAuction = rates.goldAuctionRates.find(
      (r) =>
        r.product.toLowerCase().includes("gold") &&
        (r.product.toLowerCase().includes("99.50") ||
          r.product.toLowerCase().includes("auction"))
    );

    if (goldAuction) {
      keyRates.push({
        label: "Gold 99.50",
        value: goldAuction.sell,
        type: "gold",
        icon: "🥇",
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        change: "+₹30",
        changeColor: "text-green-600",
      });
    }

    // Get Gold Market rate
    const goldMarket = rates.marketRates.find(
      (r) =>
        r.product.toLowerCase().includes("gold") &&
        (r.product.toLowerCase().includes("current") || r.ask || r.bid)
    );

    if (goldMarket) {
      const rate = goldMarket.ask || goldMarket.bid || 0;
      keyRates.push({
        label: "Gold Current",
        value: rate,
        type: "gold",
        icon: "🟡",
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-50 dark:bg-amber-900/20",
        change: "+₹25",
        changeColor: "text-green-600",
      });
    }

    // Get Silver rate
    const silverRate = rates.marketRates.find(
      (r) => r.product.toLowerCase().includes("silver") && (r.ask || r.bid)
    );

    if (silverRate) {
      const rate = silverRate.ask || silverRate.bid || 0;
      keyRates.push({
        label: "Silver 999",
        value: rate,
        type: "silver",
        icon: "⚪",
        color: "text-zinc-600 dark:text-zinc-300",
        bgColor: "bg-zinc-50 dark:bg-zinc-700",
        change: "-₹2",
        changeColor: "text-red-600",
      });
    }

    // Get Spot rate
    const spotRate = rates.spotRates.find(
      (r) =>
        r.product.toLowerCase().includes("gold") ||
        r.product.toLowerCase().includes("silver")
    );

    if (spotRate) {
      const rate = (spotRate.bid + spotRate.ask) / 2;
      const isGold = spotRate.product.toLowerCase().includes("gold");
      keyRates.push({
        label: isGold ? "Gold Spot" : "Silver Spot",
        value: rate,
        type: "spot",
        icon: "💰",
        color: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
        change: "+₹15",
        changeColor: "text-green-600",
      });
    }

    return keyRates.slice(0, 4); // Show max 4 rates
  };

  const keyRates = getKeyRates();

  if (loading) {
    return (
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
          🕷️ Live Metal Rates (Enhanced)
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="text-center p-3 bg-zinc-50 dark:bg-zinc-700 rounded-lg animate-pulse"
            >
              <div className="h-4 bg-zinc-300 dark:bg-zinc-600 rounded mb-2"></div>
              <div className="h-6 bg-zinc-300 dark:bg-zinc-600 rounded"></div>
            </div>
          ))}
        </div>
        <div className="text-center mt-3">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Scraping data with enhanced parser...
          </p>
        </div>
      </Card>
    );
  }

  if (!keyRates || keyRates.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
          🕷️ Live Metal Rates (Enhanced)
        </h3>
        <div className="text-center py-4">
          <div className="text-4xl mb-2">🔍</div>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-2">
            {rates?.status === "error" ? "Scraping failed" : "No rates found"}
          </p>
          {rates?.message && (
            <p className="text-red-600 dark:text-red-400 text-xs mb-2">
              {rates.message}
            </p>
          )}
          <button
            onClick={loadRates}
            className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
          >
            Try enhanced scraping again
          </button>

          {/* Debug Info */}
          {rates?.debug && (
            <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              <p>Tables found: {rates.debug.metadata.tableCount}</p>
              <p>Rows processed: {rates.debug.metadata.rowCount}</p>
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
          🕷️ Live Metal Rates (Enhanced)
        </h3>
        <button
          onClick={loadRates}
          className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
          title="Refresh rates"
        >
          🔄
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {keyRates.map((rate, index) => (
          <div
            key={index}
            className={`text-center p-3 ${rate.bgColor} rounded-lg hover:shadow-sm transition-shadow`}
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-lg">{rate.icon}</span>
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                {rate.label}
              </p>
            </div>
            <p className={`text-lg font-bold ${rate.color}`}>
              ₹{formatNumber(rate.value)}
            </p>
            <p className={`text-xs ${rate.changeColor}`}>{rate.change}</p>
          </div>
        ))}
      </div>

      {rates && rates.lastFetched && (
        <div className="mt-3 flex justify-between items-center text-xs text-zinc-400 dark:text-zinc-500">
          <span>Enhanced scraping</span>
          <span>
            Updated: {new Date(rates.lastFetched).toLocaleTimeString("en-IN")}
          </span>
        </div>
      )}

      {/* Debug indicator */}
      {rates?.debug && (
        <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 text-center">
          📊 {rates.debug.metadata.tableCount} tables •{" "}
          {rates.goldAuctionRates.length +
            rates.marketRates.length +
            rates.spotRates.length}{" "}
          rates extracted
        </div>
      )}

      <div className="text-center mt-2">
        <a
          href="/rates"
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          View all rates →
        </a>
      </div>
    </Card>
  );
};

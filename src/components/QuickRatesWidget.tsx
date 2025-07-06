"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/enhanced";
import {
  narnoliCorporationService,
  type NarnoliRatesData,
} from "@/services/narnolicorporationService";

export const QuickRatesWidget: React.FC = () => {
  const [rates, setRates] = useState<NarnoliRatesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRates();

    // Refresh rates every 5 minutes
    const interval = setInterval(loadRates, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadRates = async () => {
    try {
      const data = await narnoliCorporationService.getRatesWithCache();
      setRates(data);
    } catch (error) {
      console.error("Failed to load rates:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-IN").format(value);
  };

  const getKeyRates = () => {
    if (!rates || rates.status === "error") return null;

    const keyRates = [];

    // Get gold auction rate
    const goldAuction = rates.goldAuctionRates.find(
      (r) =>
        r.product.toLowerCase().includes("gold") &&
        r.product.toLowerCase().includes("99.50")
    );
    if (goldAuction) {
      keyRates.push({
        label: "Gold 99.50",
        value: goldAuction.sell,
        type: "gold",
        change: "auction",
      });
    }

    // Get gold market rate
    const goldMarket = rates.marketRates.find(
      (r) =>
        r.product.toLowerCase().includes("gold") &&
        r.product.toLowerCase().includes("current")
    );
    if (goldMarket) {
      keyRates.push({
        label: "Gold Current",
        value: goldMarket.ask || goldMarket.bid || 0,
        type: "gold",
        change: "market",
      });
    }

    // Get silver rate
    const silverMarket = rates.marketRates.find((r) =>
      r.product.toLowerCase().includes("silver")
    );
    if (silverMarket) {
      keyRates.push({
        label: "Silver 999",
        value: silverMarket.ask || silverMarket.bid || 0,
        type: "silver",
        change: "market",
      });
    }

    // Get spot rates
    const goldSpot = rates.spotRates.find((r) =>
      r.product.toLowerCase().includes("gold")
    );
    if (goldSpot) {
      keyRates.push({
        label: "Gold Spot",
        value: (goldSpot.bid + goldSpot.ask) / 2,
        type: "spot",
        change: "spot",
      });
    }

    return keyRates.slice(0, 4); // Show only top 4 rates
  };

  const keyRates = getKeyRates();

  if (loading) {
    return (
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
          📊 Live Metal Rates
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
      </Card>
    );
  }

  if (!keyRates || keyRates.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
          📊 Live Metal Rates
        </h3>
        <div className="text-center py-4">
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            Unable to load live rates
          </p>
          <button
            onClick={loadRates}
            className="text-blue-600 dark:text-blue-400 text-sm hover:underline mt-1"
          >
            Try again
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
          📊 Live Metal Rates
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
            className="text-center p-3 bg-zinc-50 dark:bg-zinc-700 rounded-lg"
          >
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-lg">
                {rate.type === "gold"
                  ? "🥇"
                  : rate.type === "silver"
                  ? "🥈"
                  : "💰"}
              </span>
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                {rate.label}
              </p>
            </div>
            <p className="text-lg font-bold text-zinc-900 dark:text-white">
              ₹{formatNumber(Math.round(rate.value))}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">
              {rate.change}
            </p>
          </div>
        ))}
      </div>

      {rates && rates.lastFetched && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center mt-3">
          Updated: {new Date(rates.lastFetched).toLocaleTimeString("en-IN")}
        </p>
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

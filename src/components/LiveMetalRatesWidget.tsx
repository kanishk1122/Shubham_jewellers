"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  narnoliCorporationService,
  type NarnoliRatesData,
} from "@/services/narnolicorporationService";

export const LiveMetalRatesWidget: React.FC = () => {
  const router = useRouter();
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
    return new Intl.NumberFormat("en-IN").format(Math.round(value));
  };

  const getDisplayRates = () => {
    if (!rates || rates.status === "error") return [];

    const displayRates = [];

    // Get Gold Current rate
    const goldCurrent = rates.marketRates.find(
      (r) =>
        r.product.toLowerCase().includes("gold") &&
        (r.product.toLowerCase().includes("current") || r.ask || r.bid)
    );

    if (goldCurrent) {
      const rate = goldCurrent.ask || goldCurrent.bid || 0;
      displayRates.push({
        name: "Gold Current",
        rate: rate,
        unit: "per gram",
        icon: "🟡",
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
        change: "+₹25", // Mock change - can be calculated if historical data available
        changeColor: "text-green-600",
      });
    }

    // Get Gold Auction rate
    const goldAuction = rates.goldAuctionRates.find(
      (r) => r.product.toLowerCase().includes("gold") && r.sell
    );

    if (goldAuction) {
      displayRates.push({
        name: "Gold 99.50",
        rate: goldAuction.sell,
        unit: "per gram",
        icon: "🥇",
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-50 dark:bg-amber-900/20",
        change: "+₹30",
        changeColor: "text-green-600",
      });
    }

    // Get Silver rate
    const silverRate = rates.marketRates.find(
      (r) => r.product.toLowerCase().includes("silver") && (r.ask || r.bid)
    );

    if (silverRate) {
      const rate = silverRate.ask || silverRate.bid || 0;
      displayRates.push({
        name: "Silver 999",
        rate: rate,
        unit: "per gram",
        icon: "⚪",
        color: "text-zinc-600 dark:text-zinc-300",
        bgColor: "bg-zinc-50 dark:bg-zinc-700",
        change: "-₹2",
        changeColor: "text-red-600",
      });
    }

    // Get Spot rate (if available)
    const spotRate = rates.spotRates.find(
      (r) =>
        r.product.toLowerCase().includes("gold") ||
        r.product.toLowerCase().includes("silver")
    );

    if (spotRate) {
      const rate = (spotRate.bid + spotRate.ask) / 2;
      const isGold = spotRate.product.toLowerCase().includes("gold");
      displayRates.push({
        name: isGold ? "Gold Spot" : "Silver Spot",
        rate: rate,
        unit: "spot price",
        icon: "💰",
        color: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
        change: "+₹15",
        changeColor: "text-green-600",
      });
    }

    // Fallback to mock data if no live data available
    if (displayRates.length === 0) {
      return [
        {
          name: "Gold 22K",
          rate: 5956,
          unit: "per gram",
          icon: "🟡",
          color: "text-yellow-600 dark:text-yellow-400",
          bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
          change: "+₹25",
          changeColor: "text-green-600",
        },
        {
          name: "Silver 925",
          rate: 78,
          unit: "per gram",
          icon: "⚪",
          color: "text-zinc-600 dark:text-zinc-300",
          bgColor: "bg-zinc-50 dark:bg-zinc-700",
          change: "-₹2",
          changeColor: "text-red-600",
        },
      ];
    }

    return displayRates.slice(0, 3); // Show max 3 rates
  };

  const displayRates = getDisplayRates();

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
          📊 Live Metal Rates
        </h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-700 rounded-lg animate-pulse"
            >
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-zinc-300 dark:bg-zinc-600 rounded"></div>
                <div>
                  <div className="h-4 w-20 bg-zinc-300 dark:bg-zinc-600 rounded mb-1"></div>
                  <div className="h-3 w-16 bg-zinc-300 dark:bg-zinc-600 rounded"></div>
                </div>
              </div>
              <div className="text-right">
                <div className="h-5 w-16 bg-zinc-300 dark:bg-zinc-600 rounded mb-1"></div>
                <div className="h-3 w-10 bg-zinc-300 dark:bg-zinc-600 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 border border-zinc-200 dark:border-zinc-700 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
          📊 Live Metal Rates
        </h3>
        <button
          onClick={loadRates}
          disabled={loading}
          className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-50"
          title="Refresh rates"
        >
          <span className={loading ? "animate-spin" : ""}>🔄</span>
        </button>
      </div>

      <div className="space-y-4">
        {displayRates.map((rate, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-3 ${rate.bgColor} rounded-lg hover:shadow-sm transition-shadow`}
          >
            <div className="flex items-center space-x-3">
              <div className="text-2xl">{rate.icon}</div>
              <div>
                <p className="font-medium text-zinc-900 dark:text-white">
                  {rate.name}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {rate.unit}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${rate.color}`}>
                ₹{formatNumber(rate.rate)}
              </p>
              <p className={`text-xs ${rate.changeColor}`}>{rate.change}</p>
            </div>
          </div>
        ))}

        {rates && rates.status === "error" && (
          <div className="text-center py-2">
            <p className="text-sm text-red-600 dark:text-red-400">
              Unable to fetch live rates
            </p>
            <button
              onClick={loadRates}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      {rates && rates.lastFetched && (
        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-600">
          <div className="flex justify-between items-center text-xs text-zinc-500 dark:text-zinc-400">
            <span>Data from: Narnoli Corporation</span>
            <span>
              Updated: {new Date(rates.lastFetched).toLocaleTimeString("en-IN")}
            </span>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-600">
        <button
          onClick={() => router.push("/rates")}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
        >
          View All Rates →
        </button>
      </div>
    </div>
  );
};

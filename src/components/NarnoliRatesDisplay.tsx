"use client";

import React, { useState, useEffect } from "react";
import { Card, Button } from "@/components/ui/enhanced";
import {
  narnoliCorporationService,
  type NarnoliRatesData,
  type MetalRate,
  type GoldAuctionRate,
  type SpotRate,
} from "@/services/narnolicorporationService";

export const NarnoliRatesDisplay: React.FC = () => {
  const [rates, setRates] = useState<NarnoliRatesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string>("");

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    setLoading(true);
    try {
      const data = await narnoliCorporationService.getRatesWithCache();
      setRates(data);
      setLastRefresh(
        new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        })
      );
    } catch (error) {
      console.error("Failed to load rates:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshRates = async () => {
    setLoading(true);
    try {
      const data = await narnoliCorporationService.fetchLiveRates();
      setRates(data);
      setLastRefresh(
        new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        })
      );
    } catch (error) {
      console.error("Failed to refresh rates:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-IN").format(value);
  };

  if (!rates) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              Loading Narnoli Corporation Rates
            </h3>
            <Button onClick={loadRates} disabled={loading}>
              {loading ? "Loading..." : "Load Rates"}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Narnoli Corporation Live Rates
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            Real-time metal rates from Narnoli Corporation
          </p>
          {lastRefresh && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Last updated: {lastRefresh}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={refreshRates}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <span>🔄</span>
            {loading ? "Refreshing..." : "Refresh Rates"}
          </Button>
        </div>
      </div>

      {/* Status */}
      {rates.status === "error" && (
        <Card className="p-4 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
          <div className="flex items-center gap-2">
            <span className="text-red-600 dark:text-red-400">⚠️</span>
            <span className="text-red-800 dark:text-red-200 font-medium">
              Error loading rates
            </span>
          </div>
          {rates.message && (
            <p className="text-red-700 dark:text-red-300 mt-1 text-sm">
              {rates.message}
            </p>
          )}
        </Card>
      )}

      {/* Gold Auction Rates */}
      {rates.goldAuctionRates.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <span>🥇</span>
            Gold Auction Rates (GST Extra)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="text-left p-3 font-semibold text-zinc-900 dark:text-white bg-orange-50 dark:bg-orange-950">
                    PRODUCT
                  </th>
                  <th className="text-center p-3 font-semibold text-zinc-900 dark:text-white bg-yellow-50 dark:bg-yellow-950">
                    M-Rate
                  </th>
                  <th className="text-center p-3 font-semibold text-zinc-900 dark:text-white bg-blue-50 dark:bg-blue-950">
                    PREMIUM
                  </th>
                  <th className="text-center p-3 font-semibold text-zinc-900 dark:text-white bg-green-50 dark:bg-green-950">
                    SELL
                  </th>
                </tr>
              </thead>
              <tbody>
                {rates.goldAuctionRates.map((rate) => (
                  <tr
                    key={rate.id}
                    className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    <td className="p-3">
                      <div className="font-medium text-zinc-900 dark:text-white">
                        {rate.product}
                      </div>
                      {rate.gst && (
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          GST: {rate.gst}
                        </div>
                      )}
                      {rate.extraMinimum && (
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          Extra Minimum: {rate.extraMinimum}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center font-mono text-yellow-700 dark:text-yellow-300">
                      {formatNumber(rate.mRate)}
                    </td>
                    <td className="p-3 text-center font-mono text-blue-700 dark:text-blue-300">
                      {formatNumber(rate.premium)}
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-green-700 dark:text-green-300">
                      {formatNumber(rate.sell)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Market Rates */}
      {rates.marketRates.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <span>📈</span>
            Market Rates
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="text-left p-3 font-semibold text-zinc-900 dark:text-white bg-orange-50 dark:bg-orange-950">
                    PRODUCT
                  </th>
                  <th className="text-center p-3 font-semibold text-zinc-900 dark:text-white bg-yellow-50 dark:bg-yellow-950">
                    BID
                  </th>
                  <th className="text-center p-3 font-semibold text-zinc-900 dark:text-white bg-blue-50 dark:bg-blue-950">
                    ASK
                  </th>
                  <th className="text-center p-3 font-semibold text-zinc-900 dark:text-white bg-green-50 dark:bg-green-950">
                    HIGH
                  </th>
                  <th className="text-center p-3 font-semibold text-zinc-900 dark:text-white bg-red-50 dark:bg-red-950">
                    LOW
                  </th>
                </tr>
              </thead>
              <tbody>
                {rates.marketRates.map((rate) => (
                  <tr
                    key={rate.id}
                    className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    <td className="p-3">
                      <div className="font-medium text-zinc-900 dark:text-white">
                        {rate.product}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 capitalize">
                        Category: {rate.category}
                      </div>
                    </td>
                    <td className="p-3 text-center font-mono text-yellow-700 dark:text-yellow-300">
                      {rate.bid ? formatNumber(rate.bid) : "-"}
                    </td>
                    <td className="p-3 text-center font-mono text-blue-700 dark:text-blue-300">
                      {rate.ask ? formatNumber(rate.ask) : "-"}
                    </td>
                    <td className="p-3 text-center font-mono text-green-700 dark:text-green-300">
                      {rate.high ? formatNumber(rate.high) : "-"}
                    </td>
                    <td className="p-3 text-center font-mono text-red-700 dark:text-red-300">
                      {rate.low ? formatNumber(rate.low) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Spot Rates */}
      {rates.spotRates.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
            <span>💰</span>
            Spot Rates
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="text-left p-3 font-semibold text-zinc-900 dark:text-white bg-orange-50 dark:bg-orange-950">
                    PRODUCT
                  </th>
                  <th className="text-center p-3 font-semibold text-zinc-900 dark:text-white bg-yellow-50 dark:bg-yellow-950">
                    BID
                  </th>
                  <th className="text-center p-3 font-semibold text-zinc-900 dark:text-white bg-blue-50 dark:bg-blue-950">
                    ASK
                  </th>
                  <th className="text-center p-3 font-semibold text-zinc-900 dark:text-white bg-green-50 dark:bg-green-950">
                    HIGH
                  </th>
                  <th className="text-center p-3 font-semibold text-zinc-900 dark:text-white bg-red-50 dark:bg-red-950">
                    LOW
                  </th>
                </tr>
              </thead>
              <tbody>
                {rates.spotRates.map((rate) => (
                  <tr
                    key={rate.id}
                    className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  >
                    <td className="p-3 font-medium text-zinc-900 dark:text-white">
                      {rate.product}
                    </td>
                    <td className="p-3 text-center font-mono text-yellow-700 dark:text-yellow-300">
                      {formatCurrency(rate.bid)}
                    </td>
                    <td className="p-3 text-center font-mono text-blue-700 dark:text-blue-300">
                      {formatCurrency(rate.ask)}
                    </td>
                    <td className="p-3 text-center font-mono text-green-700 dark:text-green-300">
                      {formatCurrency(rate.high)}
                    </td>
                    <td className="p-3 text-center font-mono text-red-700 dark:text-red-300">
                      {formatCurrency(rate.low)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* No Data Message */}
      {rates.goldAuctionRates.length === 0 &&
        rates.marketRates.length === 0 &&
        rates.spotRates.length === 0 && (
          <Card className="p-8 text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              No rates data available
            </h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Unable to fetch rates from Narnoli Corporation. This could be due
              to network issues or website changes.
            </p>
            <Button onClick={refreshRates} disabled={loading}>
              Try Again
            </Button>
          </Card>
        )}

      {/* Data Source Info */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <span className="text-blue-600 dark:text-blue-400 text-lg">ℹ️</span>
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Data Source Information
            </h4>
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              Rates are fetched from <strong>Narnoli Corporation</strong>{" "}
              (narnolicorporation.in). Data is cached for 5 minutes to improve
              performance. Click "Refresh Rates" to get the latest data.
            </p>
            {rates.lastFetched && (
              <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                Data fetched:{" "}
                {new Date(rates.lastFetched).toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                })}
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

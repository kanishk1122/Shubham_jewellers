import React, { useState, useEffect } from "react";
import { RefreshCw, TrendingUp, Clock, Zap } from "lucide-react";

interface PuppeteerRate {
  metal: string;
  rate: number;
  unit: string;
  timestamp: string;
}

interface PuppeteerRatesData {
  success: boolean;
  rates: PuppeteerRate[];
  error?: string;
  lastUpdated: Date;
}

export default function PuppeteerQuickRatesWidget() {
  const [ratesData, setRatesData] = useState<PuppeteerRatesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/scrape-narnoli", {
        method: "GET",
        headers: {
          "Cache-Control": "max-age=300",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setRatesData({
        ...data,
        lastUpdated: new Date(),
      });
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error fetching rates:", error);
      setRatesData({
        success: false,
        rates: [],
        error: error instanceof Error ? error.message : "Unknown error",
        lastUpdated: new Date(),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();

    // Auto refresh every 10 minutes
    const interval = setInterval(fetchRates, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getLatestRateByMetal = (metalType: string) => {
    if (!ratesData?.success || !ratesData.rates) return null;

    const metalRates = ratesData.rates.filter((rate) =>
      rate.metal.toLowerCase().includes(metalType.toLowerCase())
    );

    if (metalRates.length === 0) return null;

    // Return the highest rate (often more recent/accurate)
    return metalRates.reduce((highest, current) =>
      current.rate > highest.rate ? current : highest
    );
  };

  const formatRate = (rate: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(rate);
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const goldRate = getLatestRateByMetal("gold");
  const silverRate = getLatestRateByMetal("silver");

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <Zap className="h-4 w-4 text-yellow-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Live Metal Rates</h3>
            <p className="text-xs text-gray-600">Powered by Puppeteer</p>
          </div>
        </div>
        <button
          onClick={fetchRates}
          disabled={loading}
          className="p-2 rounded-md bg-yellow-600 text-white hover:bg-yellow-700 transition-colors disabled:opacity-50"
          title="Refresh rates"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && !ratesData && (
        <div className="text-center py-6">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-yellow-600 mb-2" />
          <p className="text-sm text-gray-600">Loading live rates...</p>
        </div>
      )}

      {ratesData?.error && (
        <div className="text-center py-6">
          <div className="text-red-600 text-sm">
            <p className="font-medium">Error loading rates</p>
            <p className="text-xs mt-1">{ratesData.error}</p>
          </div>
        </div>
      )}

      {ratesData?.success && (
        <div className="space-y-4">
          {/* Gold Rate */}
          {goldRate && (
            <div className="bg-white rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🥇</span>
                  <div>
                    <div className="font-semibold text-gray-900">Gold</div>
                    <div className="text-xs text-gray-500">{goldRate.unit}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {formatRate(goldRate.rate)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <TrendingUp className="h-3 w-3" />
                    <span>Live</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Silver Rate */}
          {silverRate && (
            <div className="bg-white rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🥈</span>
                  <div>
                    <div className="font-semibold text-gray-900">Silver</div>
                    <div className="text-xs text-gray-500">
                      {silverRate.unit}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {formatRate(silverRate.rate)}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <TrendingUp className="h-3 w-3" />
                    <span>Live</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="pt-3 border-t border-yellow-200">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                <span>
                  {lastUpdate
                    ? `Updated ${getTimeAgo(lastUpdate)}`
                    : "Never updated"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live from Narnoli</span>
              </div>
            </div>
          </div>

          {/* Rate Count */}
          {ratesData.rates.length > 2 && (
            <div className="text-center">
              <p className="text-xs text-gray-500">
                +{ratesData.rates.length - 2} more rates available
              </p>
            </div>
          )}
        </div>
      )}

      {ratesData?.success && !goldRate && !silverRate && (
        <div className="text-center py-6">
          <p className="text-sm text-gray-600">No gold or silver rates found</p>
          <p className="text-xs text-gray-500 mt-1">
            Found {ratesData.rates.length} other rates
          </p>
        </div>
      )}
    </div>
  );
}

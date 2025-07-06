import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Monitor,
  Clock,
  Zap,
} from "lucide-react";

interface NarnoliRate {
  metal: string;
  rate: number;
  unit: string;
  timestamp: string;
}

interface PuppeteerRatesData {
  success: boolean;
  rates: NarnoliRate[];
  error?: string;
  lastUpdated: Date;
  debugInfo?: {
    pageTitle: string;
    url: string;
    loadTime: number;
    elementsFound: number;
    htmlLength: number;
  };
}

export default function EnhancedPuppeteerRatesDisplay() {
  const [ratesData, setRatesData] = useState<PuppeteerRatesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchRates = async (useCache = true) => {
    setLoading(true);
    try {
      const response = await fetch("/api/scrape-narnoli", {
        method: "GET",
        headers: {
          "Cache-Control": useCache ? "max-age=300" : "no-cache",
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
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Error fetching Puppeteer rates:", error);
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
    fetchRates(true);
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchRates(false);
      }, 10 * 60 * 1000); // 10 minutes

      setRefreshInterval(interval);
    } else {
      if (refreshInterval) {
        clearInterval(refreshInterval);
        setRefreshInterval(null);
      }
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh]);

  const handleRefresh = () => {
    fetchRates(false);
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const getStatusIcon = () => {
    if (loading) {
      return <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />;
    }
    if (ratesData?.success) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <AlertTriangle className="h-5 w-5 text-red-500" />;
  };

  const getStatusColor = () => {
    if (loading) return "border-blue-200 bg-blue-50";
    if (ratesData?.success) return "border-green-200 bg-green-50";
    return "border-red-200 bg-red-50";
  };

  const formatRate = (rate: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(rate);
  };

  const getMetalIcon = (metal: string) => {
    const metalLower = metal.toLowerCase();
    if (metalLower.includes("gold")) return "🥇";
    if (metalLower.includes("silver")) return "🥈";
    return "💎";
  };

  const groupRatesByMetal = (rates: NarnoliRate[]) => {
    const grouped = rates.reduce((acc, rate) => {
      const metal = rate.metal;
      if (!acc[metal]) {
        acc[metal] = [];
      }
      acc[metal].push(rate);
      return acc;
    }, {} as Record<string, NarnoliRate[]>);

    return grouped;
  };

  const getAverageRate = (rates: NarnoliRate[]) => {
    if (rates.length === 0) return 0;
    const sum = rates.reduce((acc, rate) => acc + rate.rate, 0);
    return sum / rates.length;
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`border rounded-lg p-6 ${getStatusColor()}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Monitor className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Live Metal Rates
            </h3>
            <p className="text-sm text-gray-600">
              Scraped via Puppeteer from Narnoli Corporation
            </p>
          </div>
          {getStatusIcon()}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAutoRefresh}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              autoRefresh
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {autoRefresh ? "Auto ON" : "Auto OFF"}
            </div>
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            title="Refresh rates"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Status Info */}
      {ratesData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-3 rounded-lg border">
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              Status
            </div>
            <div
              className={`font-semibold ${
                ratesData.success ? "text-green-600" : "text-red-600"
              }`}
            >
              {ratesData.success ? "Success" : "Failed"}
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg border">
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              Rates Found
            </div>
            <div className="font-semibold text-blue-600">
              {ratesData.rates.length}
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg border">
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              Load Time
            </div>
            <div className="font-semibold text-purple-600">
              {ratesData.debugInfo?.loadTime
                ? `${ratesData.debugInfo.loadTime}ms`
                : "N/A"}
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg border">
            <div className="text-xs text-gray-500 uppercase tracking-wide">
              Last Updated
            </div>
            <div className="font-semibold text-gray-600">
              {lastRefresh ? getTimeAgo(lastRefresh) : "Never"}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && !ratesData && (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-500 mb-3" />
          <p className="text-gray-600">
            Scraping live rates from Narnoli Corporation...
          </p>
          <p className="text-sm text-gray-500 mt-1">
            This may take 10-15 seconds
          </p>
        </div>
      )}

      {/* Error State */}
      {ratesData?.error && !ratesData.success && (
        <div className="text-center py-8">
          <AlertTriangle className="h-8 w-8 mx-auto text-red-500 mb-3" />
          <p className="text-red-600 font-medium mb-2">Failed to fetch rates</p>
          <p className="text-sm text-red-500">{ratesData.error}</p>
        </div>
      )}

      {/* Success State with Rates */}
      {ratesData?.success && ratesData.rates.length > 0 && (
        <div className="space-y-4">
          {Object.entries(groupRatesByMetal(ratesData.rates)).map(
            ([metal, rates]) => (
              <div
                key={metal}
                className="bg-white rounded-lg border overflow-hidden"
              >
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getMetalIcon(metal)}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900">{metal}</h4>
                        <p className="text-sm text-gray-600">
                          {rates.length} rate{rates.length !== 1 ? "s" : ""}{" "}
                          found
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {formatRate(getAverageRate(rates))}
                      </div>
                      <div className="text-xs text-gray-500">Average</div>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {rates.map((rate, index) => (
                    <div key={index} className="px-4 py-3 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm text-gray-600">
                            {rate.unit}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            {formatRate(rate.rate)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(rate.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Success State but No Rates */}
      {ratesData?.success && ratesData.rates.length === 0 && (
        <div className="text-center py-8">
          <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-3" />
          <p className="text-gray-600">
            Connection successful, but no rates found
          </p>
          <p className="text-sm text-gray-500 mt-1">
            The website may have changed structure
          </p>
        </div>
      )}

      {/* Footer Info */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Monitor className="h-3 w-3" />
              Server-side scraping
            </span>
            {ratesData?.debugInfo && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {ratesData.debugInfo.pageTitle}
              </span>
            )}
          </div>
          {autoRefresh && (
            <span className="text-blue-600 font-medium">
              Auto-refresh: 10min intervals
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

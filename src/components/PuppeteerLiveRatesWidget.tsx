import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Monitor,
} from "lucide-react";
import {
  getPuppeteerRatesService,
  PuppeteerRatesResponse,
} from "@/services/puppeteerRatesService";

export default function PuppeteerLiveRatesWidget() {
  const [ratesData, setRatesData] = useState<PuppeteerRatesResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(
    null
  );

  const puppeteerService = getPuppeteerRatesService();

  const fetchRates = async (useCache = true) => {
    setLoading(true);
    try {
      const data = await puppeteerService.fetchLiveRates(useCache);
      setRatesData(data);
    } catch (error) {
      console.error("Error fetching Puppeteer rates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load cached rates on mount
    const cached = puppeteerService.getCachedRates();
    if (cached && puppeteerService.isCacheValid()) {
      setRatesData(cached);
    } else {
      fetchRates(true);
    }
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchRates(false); // Force fresh data when auto-refreshing
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
    fetchRates(false); // Force fresh data
  };

  const handleToggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const getStatusIcon = () => {
    if (loading) {
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
    }
    if (ratesData?.success) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
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
      maximumFractionDigits: 0,
    }).format(rate);
  };

  const getMetalIcon = (metal: string) => {
    const metalLower = metal.toLowerCase();
    if (metalLower.includes("gold")) return "🥇";
    if (metalLower.includes("silver")) return "🥈";
    return "💎";
  };

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Monitor className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Puppeteer Live Rates</h3>
          {getStatusIcon()}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleAutoRefresh}
            className={`px-2 py-1 text-xs rounded ${
              autoRefresh
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            Auto
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-1 rounded hover:bg-white/50 transition-colors disabled:opacity-50"
            title="Refresh rates"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading && !ratesData && (
        <div className="text-center py-4">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-500 mb-2" />
          <p className="text-sm text-gray-600">
            Loading live rates via Puppeteer...
          </p>
        </div>
      )}

      {ratesData?.error && !ratesData.success && (
        <div className="text-center py-4">
          <AlertTriangle className="h-6 w-6 mx-auto text-red-500 mb-2" />
          <p className="text-sm text-red-600 mb-1">Failed to fetch rates</p>
          <p className="text-xs text-red-500">{ratesData.error}</p>
        </div>
      )}

      {ratesData?.success && ratesData.rates.length > 0 && (
        <div className="space-y-2">
          {ratesData.rates.map((rate, index) => (
            <div
              key={`${rate.metal}-${index}`}
              className="flex items-center justify-between p-2 bg-white rounded border"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{getMetalIcon(rate.metal)}</span>
                <div>
                  <div className="font-medium text-gray-900">{rate.metal}</div>
                  <div className="text-xs text-gray-500">{rate.unit}</div>
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
          ))}
        </div>
      )}

      {ratesData?.success && ratesData.rates.length === 0 && (
        <div className="text-center py-4">
          <CheckCircle className="h-6 w-6 mx-auto text-green-500 mb-2" />
          <p className="text-sm text-gray-600">
            Connection successful, but no rates found
          </p>
        </div>
      )}

      {ratesData?.lastUpdated && (
        <div className="mt-3 pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              Last updated: {ratesData.lastUpdated.toLocaleTimeString()}
            </span>
            {ratesData.debugInfo && (
              <span>Load time: {ratesData.debugInfo.loadTime}ms</span>
            )}
          </div>
          {autoRefresh && (
            <div className="text-xs text-blue-600 mt-1">
              Auto-refresh enabled (10 min intervals)
            </div>
          )}
        </div>
      )}

      <div className="mt-2 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Monitor className="h-3 w-3" />
          <span>Server-side scraping via Puppeteer</span>
        </div>
      </div>
    </div>
  );
}

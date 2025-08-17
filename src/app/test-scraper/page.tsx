"use client";

import React, { useState } from "react";
import { RefreshCw, Target, CheckCircle, XCircle } from "lucide-react";
import axios from "axios";

interface TestResult {
  success: boolean;
  rates: any[];
  error?: string;
  debugInfo?: any;
}

export default function TestScraperPage() {
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const testScraper = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/api/test-scraper");
      const data = response.data;
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        rates: [],
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  const getSpecificRates = () => {
    if (!result?.success || !result.rates) return { gold: null, silver: null };

    const goldRate = result.rates.find(
      (r) =>
        r.source === "narnoli-specific-gold" ||
        (r.metal.toLowerCase().includes("gold") &&
          r.source?.includes("specific"))
    );

    const silverRate = result.rates.find(
      (r) =>
        r.source === "narnoli-specific-silver" ||
        (r.metal.toLowerCase().includes("silver") &&
          r.source?.includes("specific"))
    );

    return { gold: goldRate, silver: silverRate };
  };

  const { gold, silver } = getSpecificRates();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Target className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Narnoli Scraper Test
            </h1>
          </div>

          <div className="mb-6">
            <button
              onClick={testScraper}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              {loading ? "Testing..." : "Test Scraper"}
            </button>
          </div>

          {result && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span
                  className={`font-medium ${
                    result.success ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {result.success ? "Success" : "Failed"}
                </span>
              </div>

              {/* Target Rates */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Gold Rate */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    🥇 Target Gold Rate
                  </h3>
                  {gold ? (
                    <div>
                      <div className="text-2xl font-bold text-yellow-600">
                        ₹{gold.rate.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">{gold.unit}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Source: {gold.source}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 break-words">
                        Product: {gold.productDetails}
                      </div>
                    </div>
                  ) : (
                    <div className="text-red-600 text-sm">
                      Target gold rate not found
                    </div>
                  )}
                </div>

                {/* Silver Rate */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    🥈 Target Silver Rate
                  </h3>
                  {silver ? (
                    <div>
                      <div className="text-2xl font-bold text-gray-600">
                        ₹{silver.rate.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">{silver.unit}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Source: {silver.source}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 break-words">
                        Product: {silver.productDetails}
                      </div>
                    </div>
                  ) : (
                    <div className="text-red-600 text-sm">
                      Target silver rate not found
                    </div>
                  )}
                </div>
              </div>

              {/* All Rates */}
              {result.rates && result.rates.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    All Scraped Rates ({result.rates.length})
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                    {result.rates.map((rate, index) => (
                      <div
                        key={index}
                        className="text-sm border-b border-gray-200 py-2 last:border-0"
                      >
                        <div className="font-medium">
                          {rate.metal}: ₹{rate.rate.toLocaleString()} (
                          {rate.unit})
                        </div>
                        <div className="text-gray-500 text-xs">
                          Source: {rate.source}
                        </div>
                        {rate.productDetails && (
                          <div className="text-gray-400 text-xs break-words">
                            {rate.productDetails}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error */}
              {result.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-900 mb-2">Error</h3>
                  <div className="text-red-700 text-sm">{result.error}</div>
                </div>
              )}

              {/* Debug Info */}
              {result.debugInfo && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Debug Info
                  </h3>
                  <pre className="text-xs text-blue-700 overflow-auto">
                    {JSON.stringify(result.debugInfo, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

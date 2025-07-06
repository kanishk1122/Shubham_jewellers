"use client";

import React, { useState } from "react";
import { Card, Button } from "@/components/ui/enhanced";
import {
  narnoliDebugService,
  type DebugInfo,
} from "@/services/narnoliDebugService";

export const NarnoliDebugPanel: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRawData, setShowRawData] = useState(false);

  const runDebug = async () => {
    setLoading(true);
    try {
      const result = await narnoliDebugService.debugFetch();
      setDebugInfo(result);
    } catch (error) {
      console.error("Debug failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    const report = narnoliDebugService.generateDebugReport();
    const blob = new Blob([report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `narnoli-debug-${new Date().toISOString().split("T")[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
          🔧 Narnoli Corporation Debug Panel
        </h3>
        <div className="flex gap-2">
          {debugInfo && (
            <Button onClick={downloadReport} variant="secondary" size="sm">
              📥 Download Report
            </Button>
          )}
          <Button onClick={runDebug} disabled={loading} size="sm">
            {loading ? "🔄 Running..." : "🔍 Run Debug"}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin text-4xl mb-4">🔄</div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Fetching and analyzing data from Narnoli Corporation...
          </p>
        </div>
      )}

      {debugInfo && !loading && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {debugInfo.tablesFound}
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Tables Found
              </p>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {debugInfo.goldAuctionRates}
              </p>
              <p className="text-sm text-green-800 dark:text-green-300">
                Gold Rates
              </p>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {debugInfo.marketRates}
              </p>
              <p className="text-sm text-purple-800 dark:text-purple-300">
                Market Rates
              </p>
            </div>
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {debugInfo.spotRates}
              </p>
              <p className="text-sm text-orange-800 dark:text-orange-300">
                Spot Rates
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-zinc-900 dark:text-white">
                📊 Analysis
              </h4>
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-medium">URL:</span> {debugInfo.url}
                </p>
                <p>
                  <span className="font-medium">Timestamp:</span>{" "}
                  {new Date(debugInfo.timestamp).toLocaleString()}
                </p>
                <p>
                  <span className="font-medium">HTML Length:</span>{" "}
                  {debugInfo.htmlLength.toLocaleString()} chars
                </p>
                <p>
                  <span className="font-medium">Total Rows:</span>{" "}
                  {debugInfo.rowsFound}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-zinc-900 dark:text-white">
                {debugInfo.errors.length > 0 ? "❌ Errors" : "✅ Status"}
              </h4>
              {debugInfo.errors.length > 0 ? (
                <div className="text-sm text-red-600 dark:text-red-400 space-y-1">
                  {debugInfo.errors.map((error, index) => (
                    <p key={index}>• {error}</p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-green-600 dark:text-green-400">
                  ✅ Data fetching successful
                </p>
              )}
            </div>
          </div>

          {/* Parsed Data Preview */}
          {debugInfo.parsedData && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold text-zinc-900 dark:text-white">
                  📋 Parsed Data
                </h4>
                <Button
                  onClick={() => setShowRawData(!showRawData)}
                  variant="secondary"
                  size="sm"
                >
                  {showRawData ? "Hide" : "Show"} Raw Data
                </Button>
              </div>

              {showRawData && (
                <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 overflow-auto max-h-64">
                  <pre className="text-xs text-zinc-700 dark:text-zinc-300">
                    {JSON.stringify(debugInfo.parsedData, null, 2)}
                  </pre>
                </div>
              )}

              {/* Sample Data Display */}
              {debugInfo.parsedData.goldAuctionRates.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-zinc-900 dark:text-white mb-2">
                    🥇 Sample Gold Auction Rate:
                  </h5>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-sm">
                    <p>
                      <strong>Product:</strong>{" "}
                      {debugInfo.parsedData.goldAuctionRates[0].product}
                    </p>
                    <p>
                      <strong>M-Rate:</strong> ₹
                      {debugInfo.parsedData.goldAuctionRates[0].mRate}
                    </p>
                    <p>
                      <strong>Premium:</strong>{" "}
                      {debugInfo.parsedData.goldAuctionRates[0].premium}
                    </p>
                    <p>
                      <strong>Sell:</strong> ₹
                      {debugInfo.parsedData.goldAuctionRates[0].sell}
                    </p>
                  </div>
                </div>
              )}

              {debugInfo.parsedData.marketRates.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-zinc-900 dark:text-white mb-2">
                    📈 Sample Market Rate:
                  </h5>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm">
                    <p>
                      <strong>Product:</strong>{" "}
                      {debugInfo.parsedData.marketRates[0].product}
                    </p>
                    <p>
                      <strong>Category:</strong>{" "}
                      {debugInfo.parsedData.marketRates[0].category}
                    </p>
                    <p>
                      <strong>Bid:</strong>{" "}
                      {debugInfo.parsedData.marketRates[0].bid
                        ? `₹${debugInfo.parsedData.marketRates[0].bid}`
                        : "N/A"}
                    </p>
                    <p>
                      <strong>Ask:</strong>{" "}
                      {debugInfo.parsedData.marketRates[0].ask
                        ? `₹${debugInfo.parsedData.marketRates[0].ask}`
                        : "N/A"}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* HTML Preview */}
          {debugInfo.rawHTML && (
            <div className="space-y-2">
              <h4 className="font-semibold text-zinc-900 dark:text-white">
                📄 HTML Sample
              </h4>
              <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 overflow-auto max-h-32">
                <pre className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                  {debugInfo.rawHTML}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {!debugInfo && !loading && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔧</div>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Click "Run Debug" to analyze data fetching from Narnoli Corporation
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-500">
            This will help identify any issues with web scraping and data
            parsing
          </p>
        </div>
      )}
    </Card>
  );
};

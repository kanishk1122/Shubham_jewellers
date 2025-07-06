"use client";

import React, { useState } from "react";
import { Card, Button } from "@/components/ui/enhanced";
import {
  enhancedNarnoliService,
  type NarnoliScrapedRates,
  type ScrapedData,
} from "@/services/enhancedNarnoliScraper";

export const EnhancedScrapingTestPanel: React.FC = () => {
  const [scrapedData, setScrapedData] = useState<NarnoliScrapedRates | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"results" | "tables" | "debug">(
    "results"
  );

  const runScraping = async () => {
    setLoading(true);
    try {
      console.log("🕷️ Starting enhanced scraping test...");
      const result = await enhancedNarnoliService.fetchLiveRates();
      setScrapedData(result);
      console.log("✅ Scraping completed:", result);
    } catch (error) {
      console.error("❌ Scraping failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadDebugData = () => {
    if (!scrapedData?.debug) return;

    const debugReport = {
      metadata: scrapedData.debug.metadata,
      tables: scrapedData.debug.tables.map((table) => ({
        id: table.id,
        headers: table.headers,
        rowCount: table.rows.length,
        sampleRows: table.rows.slice(0, 3).map((row) => ({
          cells: row.cells.map((cell) => ({
            text: cell.text,
            numbers: cell.numbers,
          })),
        })),
      })),
      extractedRates: {
        goldAuctionRates: scrapedData.goldAuctionRates.length,
        marketRates: scrapedData.marketRates.length,
        spotRates: scrapedData.spotRates.length,
      },
    };

    const blob = new Blob([JSON.stringify(debugReport, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `narnoli-scraping-debug-${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
            🕷️ Enhanced Web Scraping Test - Narnoli Corporation
          </h3>
          <div className="flex gap-2">
            {scrapedData?.debug && (
              <Button onClick={downloadDebugData} variant="secondary" size="sm">
                📥 Download Debug Data
              </Button>
            )}
            <Button onClick={runScraping} disabled={loading} size="sm">
              {loading ? "🔄 Scraping..." : "🚀 Run Enhanced Scraping"}
            </Button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin text-4xl mb-4">🕷️</div>
            <p className="text-zinc-600 dark:text-zinc-400">
              Running enhanced web scraping with Beautiful Soup-like
              functionality...
            </p>
            <div className="mt-4 text-sm text-zinc-500 dark:text-zinc-500">
              <p>• Trying multiple CORS proxies</p>
              <p>• Parsing HTML with enhanced selectors</p>
              <p>• Extracting tables and analyzing structure</p>
              <p>• Processing data with intelligent heuristics</p>
            </div>
          </div>
        )}

        {scrapedData && !loading && (
          <div className="space-y-4">
            {/* Status Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div
                className={`text-center p-3 rounded-lg ${
                  scrapedData.status === "success"
                    ? "bg-green-50 dark:bg-green-900/20"
                    : "bg-red-50 dark:bg-red-900/20"
                }`}
              >
                <p
                  className={`text-2xl font-bold ${
                    scrapedData.status === "success"
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {scrapedData.status === "success" ? "✅" : "❌"}
                </p>
                <p className="text-sm">Status</p>
              </div>
              <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {scrapedData.debug?.metadata.tableCount || 0}
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Tables Found
                </p>
              </div>
              <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {scrapedData.goldAuctionRates.length +
                    scrapedData.marketRates.length +
                    scrapedData.spotRates.length}
                </p>
                <p className="text-sm text-purple-800 dark:text-purple-300">
                  Total Rates
                </p>
              </div>
              <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {scrapedData.debug?.metadata.rowCount || 0}
                </p>
                <p className="text-sm text-orange-800 dark:text-orange-300">
                  Total Rows
                </p>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("results")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "results"
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                📊 Extracted Rates
              </button>
              <button
                onClick={() => setActiveTab("tables")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "tables"
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                📋 Table Analysis
              </button>
              <button
                onClick={() => setActiveTab("debug")}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === "debug"
                    ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                🔧 Debug Info
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "results" && (
              <div className="space-y-4">
                {/* Gold Auction Rates */}
                {scrapedData.goldAuctionRates.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-zinc-900 dark:text-white mb-2">
                      🥇 Gold Auction Rates (
                      {scrapedData.goldAuctionRates.length})
                    </h4>
                    <div className="space-y-2">
                      {scrapedData.goldAuctionRates
                        .slice(0, 3)
                        .map((rate, index) => (
                          <div
                            key={index}
                            className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-sm"
                          >
                            <p>
                              <strong>Product:</strong> {rate.product}
                            </p>
                            <div className="grid grid-cols-3 gap-4 mt-2">
                              <p>
                                <strong>M-Rate:</strong> ₹
                                {rate.mRate.toLocaleString()}
                              </p>
                              <p>
                                <strong>Premium:</strong> {rate.premium}
                              </p>
                              <p>
                                <strong>Sell:</strong> ₹
                                {rate.sell.toLocaleString()}
                              </p>
                            </div>
                            {rate.gst && (
                              <p className="mt-1">
                                <strong>GST:</strong> {rate.gst}
                              </p>
                            )}
                          </div>
                        ))}
                      {scrapedData.goldAuctionRates.length > 3 && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          ... and {scrapedData.goldAuctionRates.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Market Rates */}
                {scrapedData.marketRates.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-zinc-900 dark:text-white mb-2">
                      📈 Market Rates ({scrapedData.marketRates.length})
                    </h4>
                    <div className="space-y-2">
                      {scrapedData.marketRates
                        .slice(0, 3)
                        .map((rate, index) => (
                          <div
                            key={index}
                            className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-sm"
                          >
                            <p>
                              <strong>Product:</strong> {rate.product}
                            </p>
                            <p>
                              <strong>Category:</strong> {rate.category}
                            </p>
                            <div className="grid grid-cols-4 gap-4 mt-2">
                              <p>
                                <strong>Bid:</strong>{" "}
                                {rate.bid
                                  ? `₹${rate.bid.toLocaleString()}`
                                  : "N/A"}
                              </p>
                              <p>
                                <strong>Ask:</strong>{" "}
                                {rate.ask
                                  ? `₹${rate.ask.toLocaleString()}`
                                  : "N/A"}
                              </p>
                              <p>
                                <strong>High:</strong>{" "}
                                {rate.high
                                  ? `₹${rate.high.toLocaleString()}`
                                  : "N/A"}
                              </p>
                              <p>
                                <strong>Low:</strong>{" "}
                                {rate.low
                                  ? `₹${rate.low.toLocaleString()}`
                                  : "N/A"}
                              </p>
                            </div>
                          </div>
                        ))}
                      {scrapedData.marketRates.length > 3 && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          ... and {scrapedData.marketRates.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Spot Rates */}
                {scrapedData.spotRates.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-zinc-900 dark:text-white mb-2">
                      💰 Spot Rates ({scrapedData.spotRates.length})
                    </h4>
                    <div className="space-y-2">
                      {scrapedData.spotRates.slice(0, 3).map((rate, index) => (
                        <div
                          key={index}
                          className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-sm"
                        >
                          <p>
                            <strong>Product:</strong> {rate.product}
                          </p>
                          <div className="grid grid-cols-4 gap-4 mt-2">
                            <p>
                              <strong>Bid:</strong> ₹{rate.bid.toLocaleString()}
                            </p>
                            <p>
                              <strong>Ask:</strong> ₹{rate.ask.toLocaleString()}
                            </p>
                            <p>
                              <strong>High:</strong> ₹
                              {rate.high.toLocaleString()}
                            </p>
                            <p>
                              <strong>Low:</strong> ₹{rate.low.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                      {scrapedData.spotRates.length > 3 && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">
                          ... and {scrapedData.spotRates.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* No Data Message */}
                {scrapedData.goldAuctionRates.length === 0 &&
                  scrapedData.marketRates.length === 0 &&
                  scrapedData.spotRates.length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">🔍</div>
                      <h4 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
                        No rates extracted
                      </h4>
                      <p className="text-zinc-600 dark:text-zinc-400">
                        The scraper found tables but couldn't extract
                        recognizable rate data. Check the Table Analysis tab for
                        more details.
                      </p>
                    </div>
                  )}
              </div>
            )}

            {activeTab === "tables" && scrapedData.debug && (
              <div className="space-y-4">
                <h4 className="font-semibold text-zinc-900 dark:text-white">
                  📋 Table Structure Analysis
                </h4>
                {scrapedData.debug.tables.map((table, index) => (
                  <div
                    key={index}
                    className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4"
                  >
                    <h5 className="font-medium text-zinc-900 dark:text-white mb-2">
                      Table {index + 1} ({table.rows.length} rows)
                    </h5>

                    {/* Headers */}
                    {table.headers.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                          Headers:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {table.headers.map((header, i) => (
                            <span
                              key={i}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 text-xs rounded"
                            >
                              {header || `Col ${i + 1}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sample Rows */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <tbody>
                          {table.rows.slice(0, 5).map((row, rowIndex) => (
                            <tr
                              key={rowIndex}
                              className="border-b border-zinc-100 dark:border-zinc-700"
                            >
                              {row.cells.map((cell, cellIndex) => (
                                <td
                                  key={cellIndex}
                                  className="p-2 border-r border-zinc-100 dark:border-zinc-700"
                                >
                                  <div
                                    className="max-w-32 truncate"
                                    title={cell.text}
                                  >
                                    {cell.text}
                                  </div>
                                  {cell.numbers.length > 0 && (
                                    <div className="text-orange-600 dark:text-orange-400 text-xs">
                                      [{cell.numbers.join(", ")}]
                                    </div>
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {table.rows.length > 5 && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                          ... and {table.rows.length - 5} more rows
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "debug" && scrapedData.debug && (
              <div className="space-y-4">
                <h4 className="font-semibold text-zinc-900 dark:text-white">
                  🔧 Debug Information
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h5 className="font-medium text-zinc-900 dark:text-white">
                      Metadata
                    </h5>
                    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 text-sm space-y-1">
                      <p>
                        <strong>Title:</strong>{" "}
                        {scrapedData.debug.metadata.title}
                      </p>
                      <p>
                        <strong>URL:</strong> {scrapedData.debug.metadata.url}
                      </p>
                      <p>
                        <strong>Timestamp:</strong>{" "}
                        {new Date(
                          scrapedData.debug.metadata.timestamp
                        ).toLocaleString()}
                      </p>
                      <p>
                        <strong>Tables:</strong>{" "}
                        {scrapedData.debug.metadata.tableCount}
                      </p>
                      <p>
                        <strong>Rows:</strong>{" "}
                        {scrapedData.debug.metadata.rowCount}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-medium text-zinc-900 dark:text-white">
                      Extraction Summary
                    </h5>
                    <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 text-sm space-y-1">
                      <p>
                        <strong>Gold Auction:</strong>{" "}
                        {scrapedData.goldAuctionRates.length} rates
                      </p>
                      <p>
                        <strong>Market Rates:</strong>{" "}
                        {scrapedData.marketRates.length} rates
                      </p>
                      <p>
                        <strong>Spot Rates:</strong>{" "}
                        {scrapedData.spotRates.length} rates
                      </p>
                      <p>
                        <strong>Status:</strong> {scrapedData.status}
                      </p>
                      {scrapedData.message && (
                        <p>
                          <strong>Message:</strong> {scrapedData.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* HTML Sample */}
                <div className="space-y-2">
                  <h5 className="font-medium text-zinc-900 dark:text-white">
                    HTML Sample (first 1000 chars)
                  </h5>
                  <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 overflow-auto max-h-32">
                    <pre className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                      {scrapedData.debug.rawHTML.substring(0, 1000)}...
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {!scrapedData && !loading && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🕷️</div>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Test the enhanced web scraping system with Beautiful Soup-like
              functionality
            </p>
            <div className="text-sm text-zinc-500 dark:text-zinc-500 space-y-1">
              <p>✨ Advanced HTML parsing and table detection</p>
              <p>🎯 Intelligent rate extraction with heuristics</p>
              <p>🔍 Comprehensive debugging and analysis</p>
              <p>📊 Detailed table structure breakdown</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

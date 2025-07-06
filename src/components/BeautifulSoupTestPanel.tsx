"use client";

import React, { useState } from "react";
import { Card, Button } from "@/components/ui/enhanced";
import {
  beautifulSoupService,
  type ScrapingResult,
  type FinancialRate,
} from "@/services/beautifulSoupTS";

export const BeautifulSoupTestPanel: React.FC = () => {
  const [result, setResult] = useState<ScrapingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "rates" | "debug">(
    "overview"
  );

  const runBeautifulSoupTest = async () => {
    setLoading(true);
    try {
      console.log("🧪 Starting Beautiful Soup TypeScript test...");
      const scrapingResult = await beautifulSoupService.scrapeNarnoliRates();
      setResult(scrapingResult);
      console.log("✅ Beautiful Soup test completed:", scrapingResult);
    } catch (error) {
      console.error("❌ Beautiful Soup test failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const runCachedTest = async () => {
    setLoading(true);
    try {
      console.log("📦 Testing Beautiful Soup with caching...");
      const scrapingResult = await beautifulSoupService.scrapeWithCache();
      setResult(scrapingResult);
      console.log("✅ Cached Beautiful Soup test completed:", scrapingResult);
    } catch (error) {
      console.error("❌ Cached Beautiful Soup test failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadResults = () => {
    if (!result) return;

    const reportData = {
      timestamp: new Date().toISOString(),
      metadata: result.metadata,
      rates: result.data,
      debug: result.debug,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `beautiful-soup-test-${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const TestDevConsole = () => {
    const runConsoleTest = async () => {
      await beautifulSoupService.testScraping();
    };

    return (
      <div className="p-4 bg-zinc-900 text-green-400 rounded-lg font-mono text-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-zinc-400">Developer Console Test</span>
          <Button onClick={runConsoleTest} size="sm" variant="secondary">
            Run Console Test
          </Button>
        </div>
        <div className="text-xs text-zinc-500">
          Click "Run Console Test" and check browser console for detailed output
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
            🍲 Beautiful Soup TypeScript - Web Scraping Test
          </h3>
          <div className="flex gap-2">
            {result && (
              <Button onClick={downloadResults} variant="secondary" size="sm">
                📥 Download Results
              </Button>
            )}
            <Button
              onClick={runCachedTest}
              disabled={loading}
              size="sm"
              variant="secondary"
            >
              {loading ? "🔄 Loading..." : "📦 Test with Cache"}
            </Button>
            <Button onClick={runBeautifulSoupTest} disabled={loading} size="sm">
              {loading ? "🔄 Scraping..." : "🕷️ Run Fresh Scrape"}
            </Button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin text-4xl mb-4">🍲</div>
            <p className="text-zinc-600 dark:text-zinc-400 mb-2">
              Beautiful Soup TypeScript is parsing the webpage...
            </p>
            <div className="text-sm text-zinc-500 dark:text-zinc-500 space-y-1">
              <p>• Trying multiple CORS proxies</p>
              <p>• Parsing HTML with DOMParser</p>
              <p>• Using Beautiful Soup-like element selection</p>
              <p>• Extracting financial data with intelligent heuristics</p>
              <p>• Processing tables and rate patterns</p>
            </div>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-4">
            {/* Status Banner */}
            <div
              className={`p-4 rounded-lg ${
                result.success
                  ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-2xl ${
                      result.success ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {result.success ? "✅" : "❌"}
                  </span>
                  <div>
                    <h4
                      className={`font-semibold ${
                        result.success
                          ? "text-green-800 dark:text-green-300"
                          : "text-red-800 dark:text-red-300"
                      }`}
                    >
                      {result.success
                        ? "Scraping Successful"
                        : "Scraping Failed"}
                    </h4>
                    <p
                      className={`text-sm ${
                        result.success
                          ? "text-green-700 dark:text-green-400"
                          : "text-red-700 dark:text-red-400"
                      }`}
                    >
                      {result.success
                        ? `Extracted ${result.metadata.elementsFound} financial rates in ${result.metadata.processingTime}ms`
                        : `Errors: ${result.metadata.errors.join(", ")}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-500">
                    {new Date(result.metadata.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-zinc-200 dark:border-zinc-700">
              <nav className="flex space-x-8">
                {["overview", "rates", "debug"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab
                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                        : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {result.metadata.elementsFound}
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Rates Found
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {result.metadata.processingTime}ms
                  </p>
                  <p className="text-sm text-green-800 dark:text-green-300">
                    Processing Time
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {result.metadata.errors.length}
                  </p>
                  <p className="text-sm text-purple-800 dark:text-purple-300">
                    Errors
                  </p>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {result.metadata.warnings.length}
                  </p>
                  <p className="text-sm text-orange-800 dark:text-orange-300">
                    Warnings
                  </p>
                </div>
              </div>
            )}

            {activeTab === "rates" && (
              <div className="space-y-4">
                {result.success && result.data.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
                      <thead className="bg-zinc-50 dark:bg-zinc-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                            Symbol
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                            High/Low
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                            Source
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-700">
                        {(result.data as FinancialRate[])
                          .slice(0, 10)
                          .map((rate, index) => (
                            <tr key={rate.id || index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-white">
                                {rate.symbol}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                                {rate.name.substring(0, 30)}...
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600 dark:text-green-400">
                                ₹{rate.price.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                                {rate.high && rate.low
                                  ? `₹${rate.high.toLocaleString()} / ₹${rate.low.toLocaleString()}`
                                  : "N/A"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500 dark:text-zinc-400">
                                {rate.source}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                    {(result.data as FinancialRate[]).length > 10 && (
                      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-4">
                        Showing first 10 of{" "}
                        {(result.data as FinancialRate[]).length} rates
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-zinc-500 dark:text-zinc-400">
                      No financial rates extracted
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "debug" && (
              <div className="space-y-4">
                {result.debug && (
                  <div className="space-y-4">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                      <h5 className="font-medium mb-2">Selectors Used:</h5>
                      <div className="flex flex-wrap gap-2">
                        {result.debug.selectors.map((selector, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded"
                          >
                            {selector}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                      <h5 className="font-medium mb-2">Patterns Matched:</h5>
                      <div className="flex flex-wrap gap-2">
                        {result.debug.patterns.map((pattern, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded"
                          >
                            {pattern}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                      <h5 className="font-medium mb-2">
                        Raw HTML Sample (first 500 chars):
                      </h5>
                      <pre className="text-xs bg-zinc-900 text-green-400 p-2 rounded overflow-x-auto">
                        {result.debug.rawHTML.substring(0, 500)}...
                      </pre>
                    </div>
                  </div>
                )}

                {result.metadata.errors.length > 0 && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <h5 className="font-medium text-red-800 dark:text-red-300 mb-2">
                      Errors:
                    </h5>
                    <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-400">
                      {result.metadata.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.metadata.warnings.length > 0 && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <h5 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                      Warnings:
                    </h5>
                    <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-400">
                      {result.metadata.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Developer Console Test */}
      <TestDevConsole />

      {/* Beautiful Soup Features Info */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-white">
          🍲 Beautiful Soup TypeScript Features
        </h4>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium mb-2 text-zinc-800 dark:text-zinc-200">
              Core Methods:
            </h5>
            <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
              <li>
                • <code>find(selector)</code> - Find first matching element
              </li>
              <li>
                • <code>findAll(selector)</code> - Find all matching elements
              </li>
              <li>
                • <code>findByText(text)</code> - Find by text content
              </li>
              <li>
                • <code>select(cssSelector)</code> - CSS selector search
              </li>
              <li>
                • <code>getText()</code> - Extract all text content
              </li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-2 text-zinc-800 dark:text-zinc-200">
              Financial Data Methods:
            </h5>
            <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
              <li>
                • <code>extractNumbers()</code> - Extract all numbers
              </li>
              <li>
                • <code>extractPrices()</code> - Extract currency values
              </li>
              <li>
                • <code>extractPercentages()</code> - Extract percentage values
              </li>
              <li>
                • <code>findTableCells()</code> - Find table cells
              </li>
              <li>
                • <code>getTablePosition()</code> - Get cell position
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BeautifulSoupTestPanel;

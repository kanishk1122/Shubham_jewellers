"use client";

import React, { useState } from "react";
import { Card, Button } from "@/components/ui/enhanced";
import {
  spaNarnoliService,
  type SPAScrapingResult,
} from "@/services/spaNarnoliScraper";
import HTMLStructureAnalyzer from "@/components/HTMLStructureAnalyzer";

export const SPAScrapingTestPanel: React.FC = () => {
  const [result, setResult] = useState<SPAScrapingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "data" | "debug" | "analysis"
  >("overview");

  const runSPAScraping = async () => {
    setLoading(true);
    try {
      console.log("🕷️ Starting SPA-aware scraping...");
      const scrapingResult = await spaNarnoliService.scrapeSPAData();
      setResult(scrapingResult);
      console.log("✅ SPA scraping completed:", scrapingResult);
    } catch (error) {
      console.error("❌ SPA scraping failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const runCachedSPAScraping = async () => {
    setLoading(true);
    try {
      console.log("📦 Testing SPA scraping with caching...");
      const scrapingResult = await spaNarnoliService.scrapeWithCache();
      setResult(scrapingResult);
      console.log("✅ Cached SPA scraping completed:", scrapingResult);
    } catch (error) {
      console.error("❌ Cached SPA scraping failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadResults = () => {
    if (!result) return;

    const reportData = {
      timestamp: new Date().toISOString(),
      metadata: result.metadata,
      data: result.data,
      debug: result.debug,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `spa-scraping-test-${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case "static-html":
        return "📄";
      case "spa-simulation":
        return "⚛️";
      case "api-detection":
        return "🔍";
      case "fallback":
        return "🔄";
      default:
        return "❓";
    }
  };

  const getMethodDescription = (method: string) => {
    switch (method) {
      case "static-html":
        return "Traditional HTML parsing";
      case "spa-simulation":
        return "React SPA simulation with delayed loading";
      case "api-detection":
        return "Detected and scraped from API endpoints";
      case "fallback":
        return "Used fallback strategies";
      default:
        return "Unknown method";
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
            ⚛️ SPA (React) Scraping Test - Narnoli Corporation
          </h3>
          <div className="flex gap-2">
            {result && (
              <Button onClick={downloadResults} variant="secondary" size="sm">
                📥 Download Results
              </Button>
            )}
            <Button
              onClick={runCachedSPAScraping}
              disabled={loading}
              size="sm"
              variant="secondary"
            >
              {loading ? "🔄 Loading..." : "📦 Test with Cache"}
            </Button>
            <Button onClick={runSPAScraping} disabled={loading} size="sm">
              {loading ? "🔄 Scraping..." : "🕷️ Run SPA Scraping"}
            </Button>
          </div>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin text-4xl mb-4">⚛️</div>
            <p className="text-zinc-600 dark:text-zinc-400 mb-2">
              SPA-aware scraping in progress...
            </p>
            <div className="text-sm text-zinc-500 dark:text-zinc-500 space-y-1">
              <p>• Analyzing HTML structure for React/SPA patterns</p>
              <p>• Detecting JavaScript-loaded content</p>
              <p>• Searching for API endpoints</p>
              <p>• Trying SPA simulation strategies</p>
              <p>• Applying fallback methods if needed</p>
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
                <div className="flex items-center space-x-3">
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
                        ? "SPA Scraping Successful"
                        : "SPA Scraping Failed"}
                    </h4>
                    <div className="flex items-center space-x-4 mt-1">
                      <p
                        className={`text-sm ${
                          result.success
                            ? "text-green-700 dark:text-green-400"
                            : "text-red-700 dark:text-red-400"
                        }`}
                      >
                        Method: {getMethodIcon(result.metadata.method)}{" "}
                        {getMethodDescription(result.metadata.method)}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {result.metadata.processingTime}ms
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-500">
                    {new Date(result.metadata.timestamp).toLocaleString()}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Elements: {result.metadata.elementsFound}
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-zinc-200 dark:border-zinc-700">
              <nav className="flex space-x-8">
                {["overview", "data", "debug", "analysis"].map((tab) => (
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
                    Data Elements
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
                    {getMethodIcon(result.metadata.method)}
                  </p>
                  <p className="text-sm text-purple-800 dark:text-purple-300">
                    {result.metadata.method}
                  </p>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {result.metadata.errors.length}
                  </p>
                  <p className="text-sm text-orange-800 dark:text-orange-300">
                    Errors
                  </p>
                </div>
              </div>
            )}

            {activeTab === "data" && (
              <div className="space-y-4">
                {result.success && result.data.length > 0 ? (
                  <div className="space-y-4">
                    {result.data.map((item, index) => (
                      <div
                        key={index}
                        className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-medium text-zinc-900 dark:text-white">
                            Data Item {index + 1}
                          </h5>
                          <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">
                            {item.type || "unknown"}
                          </span>
                        </div>

                        {item.values && Array.isArray(item.values) && (
                          <div className="mb-2">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                              Values:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {item.values
                                .slice(0, 10)
                                .map((value: any, i: number) => (
                                  <span
                                    key={i}
                                    className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded"
                                  >
                                    {typeof value === "number"
                                      ? value.toLocaleString()
                                      : value}
                                  </span>
                                ))}
                              {item.values.length > 10 && (
                                <span className="text-xs text-zinc-500">
                                  +{item.values.length - 10} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {item.text && (
                          <div className="mb-2">
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                              Text:
                            </p>
                            <p className="text-xs text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-900 p-2 rounded">
                              {item.text.length > 200
                                ? item.text.substring(0, 200) + "..."
                                : item.text}
                            </p>
                          </div>
                        )}

                        <p className="text-xs text-zinc-500">
                          Source: {item.source}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-zinc-500 dark:text-zinc-400 mb-2">
                      No data extracted
                    </p>
                    <p className="text-sm text-zinc-400">
                      The website appears to be a React SPA with dynamically
                      loaded content. Try the analysis tab to understand the
                      website structure.
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "debug" && (
              <div className="space-y-4">
                {result.debug && (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        <h5 className="font-medium mb-2">Detection Results:</h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <span
                              className={
                                result.debug.jsDetected
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {result.debug.jsDetected ? "✅" : "❌"}
                            </span>
                            <span>JavaScript Detected</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={
                                result.debug.reactDetected
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {result.debug.reactDetected ? "✅" : "❌"}
                            </span>
                            <span>React SPA Detected</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={
                                result.debug.apiEndpoints.length > 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {result.debug.apiEndpoints.length > 0
                                ? "✅"
                                : "❌"}
                            </span>
                            <span>
                              API Endpoints Found:{" "}
                              {result.debug.apiEndpoints.length}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                        <h5 className="font-medium mb-2">API Endpoints:</h5>
                        {result.debug.apiEndpoints.length > 0 ? (
                          <div className="space-y-1">
                            {result.debug.apiEndpoints.map(
                              (endpoint, index) => (
                                <div
                                  key={index}
                                  className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded"
                                >
                                  {endpoint}
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-zinc-500">
                            No API endpoints detected
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                      <h5 className="font-medium mb-2">
                        Initial HTML (first 500 chars):
                      </h5>
                      <pre className="text-xs bg-zinc-900 text-green-400 p-2 rounded overflow-x-auto whitespace-pre-wrap">
                        {result.debug.initialHTML.substring(0, 500)}...
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
              </div>
            )}

            {activeTab === "analysis" && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3">
                    🔍 Website Analysis
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>
                      <strong>Website Type:</strong> React Single Page
                      Application (SPA)
                    </div>
                    <div>
                      <strong>Content Loading:</strong> Dynamic via JavaScript
                    </div>
                    <div>
                      <strong>Scraping Challenge:</strong> Content is not
                      present in initial HTML
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-3">
                    ⚠️ SPA Scraping Challenges
                  </h4>
                  <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                    <li>Initial HTML only contains React app shell</li>
                    <li>Actual data is loaded by JavaScript after page load</li>
                    <li>
                      Traditional HTML parsing cannot access dynamic content
                    </li>
                    <li>
                      API endpoints may require authentication or have CORS
                      restrictions
                    </li>
                    <li>
                      Content may be loaded via WebSocket or real-time
                      connections
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-semibold text-green-800 dark:text-green-300 mb-3">
                    💡 Potential Solutions
                  </h4>
                  <ol className="list-decimal list-inside text-sm text-green-700 dark:text-green-400 space-y-1">
                    <li>
                      Server-side rendering with headless browser
                      (Puppeteer/Playwright)
                    </li>
                    <li>Direct API access if endpoints can be identified</li>
                    <li>WebSocket connection monitoring</li>
                    <li>Mobile app API reverse engineering</li>
                    <li>Alternative data sources with similar information</li>
                  </ol>
                </div>

                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-3">
                    🛠️ Next Steps
                  </h4>
                  <div className="text-sm text-purple-700 dark:text-purple-400 space-y-2">
                    <p>
                      <strong>Immediate:</strong> Check browser developer tools
                      for network requests to find API endpoints
                    </p>
                    <p>
                      <strong>Short-term:</strong> Implement server-side
                      scraping with headless browser
                    </p>
                    <p>
                      <strong>Long-term:</strong> Contact Narnoli Corporation
                      for official API access
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* HTML Structure Analyzer */}
      <HTMLStructureAnalyzer />

      {/* SPA Scraping Info */}
      <Card className="p-6">
        <h4 className="text-lg font-semibold mb-4 text-zinc-900 dark:text-white">
          ⚛️ SPA Scraping Capabilities
        </h4>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium mb-2 text-zinc-800 dark:text-zinc-200">
              Detection Features:
            </h5>
            <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
              <li>• React/SPA pattern detection</li>
              <li>• JavaScript content analysis</li>
              <li>• API endpoint discovery</li>
              <li>• WebSocket connection detection</li>
              <li>• Embedded JSON extraction</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium mb-2 text-zinc-800 dark:text-zinc-200">
              Scraping Strategies:
            </h5>
            <ul className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
              <li>• Static HTML parsing (fallback)</li>
              <li>• API endpoint testing</li>
              <li>• SPA simulation with delays</li>
              <li>• URL variation testing</li>
              <li>• Financial pattern extraction</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SPAScrapingTestPanel;

import React, { useState } from "react";
import {
  Download,
  Eye,
  Play,
  Square,
  RefreshCw,
  Monitor,
  Bug,
} from "lucide-react";

interface PuppeteerResult {
  success: boolean;
  rates: Array<{
    metal: string;
    rate: number;
    unit: string;
    timestamp: string;
  }>;
  error?: string;
  debugInfo?: {
    pageTitle: string;
    url: string;
    loadTime: number;
    elementsFound: number;
    htmlLength: number;
    screenshot?: string;
  };
}

export default function PuppeteerTestPanel() {
  const [result, setResult] = useState<PuppeteerResult | null>(null);
  const [structure, setStructure] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [structureLoading, setStructureLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleScrapeTest = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      console.log("Starting Puppeteer scraping test...");

      const response = await fetch("/api/scrape-narnoli", {
        method: "GET",
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);

      console.log("Puppeteer scraping result:", data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Puppeteer scraping error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGetStructure = async () => {
    setStructureLoading(true);
    setError("");

    try {
      console.log("Getting page structure with Puppeteer...");

      const response = await fetch("/api/scrape-narnoli", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "getStructure" }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStructure(data.structure);

      console.log("Page structure:", data.structure);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Structure fetch error:", err);
    } finally {
      setStructureLoading(false);
    }
  };

  const handleCloseBrowser = async () => {
    try {
      const response = await fetch("/api/scrape-narnoli", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "close" }),
      });

      if (response.ok) {
        console.log("Browser closed successfully");
      }
    } catch (err) {
      console.error("Error closing browser:", err);
    }
  };

  const downloadResult = () => {
    if (!result) return;

    const dataStr = JSON.stringify(result, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `puppeteer-narnoli-result-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, "-")}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadStructure = () => {
    if (!structure) return;

    const dataStr = JSON.stringify(structure, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `puppeteer-structure-${new Date()
      .toISOString()
      .slice(0, 19)
      .replace(/:/g, "-")}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const viewScreenshot = () => {
    if (!result?.debugInfo?.screenshot) return;

    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head><title>Puppeteer Screenshot</title></head>
          <body style="margin: 0; padding: 20px; background: #f0f0f0;">
            <h2>Narnoli Corporation - Puppeteer Screenshot</h2>
            <p>Captured at: ${new Date().toLocaleString()}</p>
            <img src="${
              result.debugInfo.screenshot
            }" style="max-width: 100%; border: 1px solid #ccc; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
          </body>
        </html>
      `);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center gap-2 mb-4">
        <Monitor className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">
          Puppeteer Server-Side Scraping Test
        </h3>
      </div>

      <div className="space-y-4">
        {/* Control Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleScrapeTest}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {loading ? "Scraping..." : "Start Puppeteer Scraping"}
          </button>

          <button
            onClick={handleGetStructure}
            disabled={structureLoading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            {structureLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Bug className="h-4 w-4" />
            )}
            {structureLoading ? "Loading..." : "Get Page Structure"}
          </button>

          <button
            onClick={handleCloseBrowser}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            <Square className="h-4 w-4" />
            Close Browser
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {/* Results Display */}
        {result && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">
                  Scraping Results
                </h4>
                <div className="flex gap-2">
                  {result.debugInfo?.screenshot && (
                    <button
                      onClick={viewScreenshot}
                      className="flex items-center gap-1 px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                    >
                      <Eye className="h-3 w-3" />
                      Screenshot
                    </button>
                  )}
                  <button
                    onClick={downloadResult}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    <Download className="h-3 w-3" />
                    Download
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white p-3 rounded border">
                  <div className="text-sm text-gray-600">Success</div>
                  <div
                    className={`font-semibold ${
                      result.success ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {result.success ? "Yes" : "No"}
                  </div>
                </div>
                <div className="bg-white p-3 rounded border">
                  <div className="text-sm text-gray-600">Rates Found</div>
                  <div className="font-semibold text-blue-600">
                    {result.rates.length}
                  </div>
                </div>
                {result.debugInfo && (
                  <>
                    <div className="bg-white p-3 rounded border">
                      <div className="text-sm text-gray-600">Load Time</div>
                      <div className="font-semibold text-purple-600">
                        {result.debugInfo.loadTime}ms
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="text-sm text-gray-600">HTML Length</div>
                      <div className="font-semibold text-indigo-600">
                        {result.debugInfo.htmlLength.toLocaleString()}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {result.debugInfo && (
                <div className="bg-white p-3 rounded border mb-4">
                  <div className="text-sm text-gray-600">Page Info</div>
                  <div className="mt-1">
                    <div>
                      <strong>Title:</strong> {result.debugInfo.pageTitle}
                    </div>
                    <div>
                      <strong>URL:</strong> {result.debugInfo.url}
                    </div>
                  </div>
                </div>
              )}

              {result.rates.length > 0 && (
                <div className="bg-white rounded border">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                          Metal
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                          Rate
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                          Unit
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">
                          Timestamp
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {result.rates.map((rate, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            {rate.metal}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            ₹{rate.rate.toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {rate.unit}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">
                            {new Date(rate.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {result.error && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <div className="text-red-800">
                    <strong>Scraping Error:</strong> {result.error}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Structure Display */}
        {structure && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">
                Page Structure (Puppeteer)
              </h4>
              <button
                onClick={downloadStructure}
                className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                <Download className="h-3 w-3" />
                Download
              </button>
            </div>

            <div className="bg-white p-4 rounded border max-h-96 overflow-auto">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                {JSON.stringify(structure, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">
            How Puppeteer Scraping Works:
          </h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Launches a headless Chrome browser on the server</li>
            <li>• Navigates to Narnoli Corporation website</li>
            <li>• Waits for JavaScript to render the React SPA</li>
            <li>
              • Extracts rates using multiple strategies (tables, divs, scripts)
            </li>
            <li>• Captures screenshots for debugging</li>
            <li>• Returns structured data with debug information</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

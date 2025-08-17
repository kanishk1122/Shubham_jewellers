"use client";

import React, { useState } from "react";
import { Card, Button } from "@/components/ui/enhanced";
import axios from "axios";

export const HTMLStructureAnalyzer: React.FC = () => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "structure" | "content" | "scripts" | "recommendations"
  >("structure");

  const analyzeHTML = async () => {
    setLoading(true);
    try {
      console.log("🔍 Analyzing Narnoli Corporation HTML structure...");

      // Fetch HTML using multiple methods
      const results = await fetchWithMultipleMethods();
      setAnalysis(results);

      console.log("✅ HTML analysis completed:", results);
    } catch (error) {
      console.error("❌ HTML analysis failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWithMultipleMethods = async () => {
    const url = "http://narnolicorporation.in";
    const results: any = {
      timestamp: new Date().toISOString(),
      url,
      methods: [],
      analysis: null,
    };

    // Method 1: AllOrigins proxy
    try {
      console.log("📡 Trying AllOrigins proxy...");
      const response1 = await axios.get(
        `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
      );
      if (response1.status === 200) {
        const data1 = response1.data;
        const html1 = data1.contents || "";

        results.methods.push({
          name: "AllOrigins",
          success: true,
          htmlLength: html1.length,
          html: html1,
        });
      }
    } catch (error) {
      results.methods.push({
        name: "AllOrigins",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Method 2: CodeTabs proxy
    try {
      console.log("📡 Trying CodeTabs proxy...");
      const response2 = await axios.get(
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
      );
      if (response2.status === 200) {
        const html2 = response2.data;

        results.methods.push({
          name: "CodeTabs",
          success: true,
          htmlLength: html2.length,
          html: html2,
        });
      }
    } catch (error) {
      results.methods.push({
        name: "CodeTabs",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Method 3: CorsProxy.io
    try {
      console.log("📡 Trying CorsProxy.io...");
      const response3 = await axios.get(
        `https://corsproxy.io/?${encodeURIComponent(url)}`
      );
      if (response3.status === 200) {
        const html3 = response3.data;

        results.methods.push({
          name: "CorsProxy.io",
          success: true,
          htmlLength: html3.length,
          html: html3,
        });
      }
    } catch (error) {
      results.methods.push({
        name: "CorsProxy.io",
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Analyze the best result
    const successfulMethod = results.methods.find(
      (m: any) => m.success && m.html
    );

    if (successfulMethod) {
      results.analysis = analyzeHTMLStructure(
        successfulMethod.html,
        successfulMethod.name
      );
    }

    return results;
  };

  const analyzeHTMLStructure = (html: string, source: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const analysis = {
      source,
      totalLength: html.length,
      structure: {
        title: doc.title || "No title",
        hasHead: !!doc.head,
        hasBody: !!doc.body,
        bodyContent: doc.body?.innerHTML?.length || 0,
      },
      react: {
        hasReactRoot: !!doc.querySelector("#root"),
        hasReactScripts: html.includes("react") || html.includes("React"),
        hasMainJS: /main\.[a-f0-9]+\.js/.test(html),
        hasReactDevTools: html.includes("react-dom"),
      },
      scripts: {
        total: doc.querySelectorAll("script").length,
        external: doc.querySelectorAll("script[src]").length,
        inline: doc.querySelectorAll("script:not([src])").length,
        sources: Array.from(doc.querySelectorAll("script[src]"))
          .map((s) => s.getAttribute("src"))
          .filter(Boolean),
      },
      content: {
        tables: doc.querySelectorAll("table").length,
        divs: doc.querySelectorAll("div").length,
        spans: doc.querySelectorAll("span").length,
        paragraphs: doc.querySelectorAll("p").length,
        textContent: doc.body?.textContent?.trim().length || 0,
      },
      meta: {
        charset: doc.querySelector("meta[charset]")?.getAttribute("charset"),
        viewport: !!doc.querySelector('meta[name="viewport"]'),
        description: doc
          .querySelector('meta[name="description"]')
          ?.getAttribute("content"),
      },
      links: {
        stylesheets: doc.querySelectorAll('link[rel="stylesheet"]').length,
        favicon: !!doc.querySelector(
          'link[rel="icon"], link[rel="shortcut icon"]'
        ),
        external: Array.from(doc.querySelectorAll("link[href]"))
          .map((l) => l.getAttribute("href"))
          .filter(Boolean),
      },
      potentialDataSources: findPotentialDataSources(html, doc),
      rawHTML: html.substring(0, 3000), // First 3000 chars for inspection
    };

    return analysis;
  };

  const findPotentialDataSources = (html: string, doc: Document) => {
    const sources: any[] = [];

    // Look for API patterns in script sources
    const scriptSources = Array.from(doc.querySelectorAll("script[src]")).map(
      (s) => s.getAttribute("src")
    );
    scriptSources.forEach((src) => {
      if (
        src &&
        (src.includes("api") || src.includes("data") || src.includes("main"))
      ) {
        sources.push({
          type: "script",
          source: src,
          description: "Potential API or data loading script",
        });
      }
    });

    // Look for WebSocket patterns
    if (
      html.includes("ws://") ||
      html.includes("wss://") ||
      html.includes("socket.io")
    ) {
      sources.push({
        type: "websocket",
        description: "WebSocket connections detected in HTML",
      });
    }

    // Look for fetch/axios patterns
    if (
      html.includes("fetch(") ||
      html.includes("axios") ||
      html.includes("XMLHttpRequest")
    ) {
      sources.push({
        type: "ajax",
        description: "AJAX/Fetch API calls detected",
      });
    }

    // Look for JSON data in script tags
    const scriptContents = Array.from(
      doc.querySelectorAll("script:not([src])")
    ).map((s) => s.textContent || "");
    scriptContents.forEach((content) => {
      if (content.includes("{") && content.includes("}")) {
        sources.push({
          type: "embedded_json",
          description: "Potential JSON data in script tag",
          preview: content.substring(0, 100) + "...",
        });
      }
    });

    return sources;
  };

  const downloadAnalysis = () => {
    if (!analysis) return;

    const blob = new Blob([JSON.stringify(analysis, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `narnoli-html-analysis-${
      new Date().toISOString().split("T")[0]
    }.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
          🔍 HTML Structure Analyzer
        </h3>
        <div className="flex gap-2">
          {analysis && (
            <Button onClick={downloadAnalysis} variant="secondary" size="sm">
              📥 Download Analysis
            </Button>
          )}
          <Button onClick={analyzeHTML} disabled={loading} size="sm">
            {loading ? "🔄 Analyzing..." : "🔍 Analyze HTML"}
          </Button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin text-4xl mb-4">🔍</div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Analyzing HTML structure using multiple methods...
          </p>
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-4">
          {/* Quick Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {analysis.methods.filter((m: any) => m.success).length}
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                Successful Methods
              </p>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {analysis.analysis?.react.hasReactRoot ? "✅" : "❌"}
              </p>
              <p className="text-sm text-green-800 dark:text-green-300">
                React SPA
              </p>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {analysis.analysis?.content.tables || 0}
              </p>
              <p className="text-sm text-purple-800 dark:text-purple-300">
                Tables Found
              </p>
            </div>
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {analysis.analysis?.scripts.total || 0}
              </p>
              <p className="text-sm text-orange-800 dark:text-orange-300">
                Script Tags
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-zinc-200 dark:border-zinc-700">
            <nav className="flex space-x-8">
              {["structure", "content", "scripts", "recommendations"].map(
                (tab) => (
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
                )
              )}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === "structure" && analysis.analysis && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <h5 className="font-medium mb-3">Basic Structure:</h5>
                  <div className="space-y-2 text-sm">
                    <div>
                      Title:{" "}
                      <code className="bg-zinc-200 dark:bg-zinc-700 px-1 rounded">
                        {analysis.analysis.structure.title}
                      </code>
                    </div>
                    <div>
                      HTML Length:{" "}
                      {analysis.analysis.totalLength.toLocaleString()}{" "}
                      characters
                    </div>
                    <div>
                      Body Content:{" "}
                      {analysis.analysis.structure.bodyContent.toLocaleString()}{" "}
                      characters
                    </div>
                    <div>
                      Text Content:{" "}
                      {analysis.analysis.content.textContent.toLocaleString()}{" "}
                      characters
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <h5 className="font-medium mb-3">React Detection:</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <span
                        className={
                          analysis.analysis.react.hasReactRoot
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {analysis.analysis.react.hasReactRoot ? "✅" : "❌"}
                      </span>
                      <span>React Root Element</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={
                          analysis.analysis.react.hasReactScripts
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {analysis.analysis.react.hasReactScripts ? "✅" : "❌"}
                      </span>
                      <span>React Scripts</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={
                          analysis.analysis.react.hasMainJS
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {analysis.analysis.react.hasMainJS ? "✅" : "❌"}
                      </span>
                      <span>Main JS Bundle</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <h5 className="font-medium mb-3">Fetch Methods Comparison:</h5>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-300 dark:border-zinc-600">
                        <th className="text-left py-2">Method</th>
                        <th className="text-left py-2">Status</th>
                        <th className="text-left py-2">HTML Length</th>
                        <th className="text-left py-2">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.methods.map((method: any, index: number) => (
                        <tr
                          key={index}
                          className="border-b border-zinc-200 dark:border-zinc-700"
                        >
                          <td className="py-2 font-medium">{method.name}</td>
                          <td className="py-2">
                            <span
                              className={
                                method.success
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {method.success ? "✅ Success" : "❌ Failed"}
                            </span>
                          </td>
                          <td className="py-2">
                            {method.htmlLength?.toLocaleString() || "N/A"}
                          </td>
                          <td className="py-2 text-red-600 text-xs">
                            {method.error || "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "content" && analysis.analysis && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <h5 className="font-medium mb-3">HTML Elements:</h5>
                  <div className="space-y-1 text-sm">
                    <div>Tables: {analysis.analysis.content.tables}</div>
                    <div>Divs: {analysis.analysis.content.divs}</div>
                    <div>Spans: {analysis.analysis.content.spans}</div>
                    <div>
                      Paragraphs: {analysis.analysis.content.paragraphs}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <h5 className="font-medium mb-3">Meta Information:</h5>
                  <div className="space-y-1 text-sm">
                    <div>
                      Charset:{" "}
                      {analysis.analysis.meta.charset || "Not specified"}
                    </div>
                    <div>
                      Viewport: {analysis.analysis.meta.viewport ? "✅" : "❌"}
                    </div>
                    <div>
                      Description:{" "}
                      {analysis.analysis.meta.description ? "✅" : "❌"}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                  <h5 className="font-medium mb-3">External Resources:</h5>
                  <div className="space-y-1 text-sm">
                    <div>
                      Stylesheets: {analysis.analysis.links.stylesheets}
                    </div>
                    <div>
                      Favicon: {analysis.analysis.links.favicon ? "✅" : "❌"}
                    </div>
                    <div>Scripts: {analysis.analysis.scripts.external}</div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <h5 className="font-medium mb-3">
                  Raw HTML Preview (first 1000 characters):
                </h5>
                <pre className="text-xs bg-zinc-900 text-green-400 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                  {analysis.analysis.rawHTML.substring(0, 1000)}...
                </pre>
              </div>
            </div>
          )}

          {activeTab === "scripts" && analysis.analysis && (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <h5 className="font-medium mb-3">Script Analysis:</h5>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {analysis.analysis.scripts.total}
                    </div>
                    <div className="text-sm text-zinc-600">Total Scripts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {analysis.analysis.scripts.external}
                    </div>
                    <div className="text-sm text-zinc-600">
                      External Scripts
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {analysis.analysis.scripts.inline}
                    </div>
                    <div className="text-sm text-zinc-600">Inline Scripts</div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <h5 className="font-medium mb-3">Script Sources:</h5>
                <div className="space-y-2">
                  {analysis.analysis.scripts.sources.map(
                    (src: string, index: number) => (
                      <div
                        key={index}
                        className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded"
                      >
                        {src}
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg">
                <h5 className="font-medium mb-3">Potential Data Sources:</h5>
                <div className="space-y-3">
                  {analysis.analysis.potentialDataSources.map(
                    (source: any, index: number) => (
                      <div
                        key={index}
                        className="border border-zinc-300 dark:border-zinc-600 rounded p-3"
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 px-2 py-1 rounded">
                            {source.type}
                          </span>
                          <span className="text-sm font-medium">
                            {source.description}
                          </span>
                        </div>
                        {source.source && (
                          <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                            Source: {source.source}
                          </div>
                        )}
                        {source.preview && (
                          <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 bg-zinc-200 dark:bg-zinc-700 p-1 rounded">
                            {source.preview}
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "recommendations" && analysis.analysis && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3">
                  📊 Analysis Summary
                </h4>
                <div className="text-sm text-blue-700 dark:text-blue-400">
                  <p>
                    The website is confirmed to be a{" "}
                    <strong>React Single Page Application (SPA)</strong> with
                    dynamic content loading.
                  </p>
                  <p className="mt-2">Key findings:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>
                      React root element detected:{" "}
                      {analysis.analysis.react.hasReactRoot ? "Yes" : "No"}
                    </li>
                    <li>
                      Main JavaScript bundle:{" "}
                      {analysis.analysis.react.hasMainJS
                        ? "Found"
                        : "Not found"}
                    </li>
                    <li>
                      Static tables in HTML: {analysis.analysis.content.tables}
                    </li>
                    <li>
                      Total text content:{" "}
                      {analysis.analysis.content.textContent} characters
                    </li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-3">
                  ⚠️ Scraping Challenges
                </h4>
                <ul className="list-disc list-inside text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
                  <li>
                    Content is loaded dynamically via JavaScript after page load
                  </li>
                  <li>
                    Initial HTML contains only the React application shell
                  </li>
                  <li>
                    Rate data is likely fetched from APIs that may have CORS
                    restrictions
                  </li>
                  <li>
                    Traditional HTML parsing will not find the actual rate data
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h4 className="font-semibold text-green-800 dark:text-green-300 mb-3">
                  💡 Recommended Solutions
                </h4>
                <ol className="list-decimal list-inside text-sm text-green-700 dark:text-green-400 space-y-1">
                  <li>
                    <strong>Server-side scraping:</strong> Use Puppeteer or
                    Playwright to render JavaScript
                  </li>
                  <li>
                    <strong>API reverse engineering:</strong> Monitor network
                    requests to find data endpoints
                  </li>
                  <li>
                    <strong>Mobile app API:</strong> Check if they have a mobile
                    app with accessible APIs
                  </li>
                  <li>
                    <strong>Alternative sources:</strong> Find other websites
                    with similar rate data
                  </li>
                  <li>
                    <strong>Direct contact:</strong> Reach out to Narnoli
                    Corporation for API access
                  </li>
                </ol>
              </div>

              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-3">
                  🛠️ Next Steps
                </h4>
                <div className="text-sm text-purple-700 dark:text-purple-400 space-y-2">
                  <p>
                    <strong>Immediate (Browser):</strong>
                  </p>
                  <ul className="list-disc list-inside ml-4">
                    <li>Open Narnoli website in browser dev tools</li>
                    <li>Monitor Network tab for API calls</li>
                    <li>Look for WebSocket connections</li>
                  </ul>

                  <p>
                    <strong>Short-term (Server-side):</strong>
                  </p>
                  <ul className="list-disc list-inside ml-4">
                    <li>Implement Puppeteer-based scraping</li>
                    <li>Create API endpoint detection system</li>
                    <li>Set up automated monitoring</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default HTMLStructureAnalyzer;

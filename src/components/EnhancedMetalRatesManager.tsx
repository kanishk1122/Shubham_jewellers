"use client";

import React, { useState } from "react";
import { useMetalRates } from "@/services/metalRatesService";
import {
  Card,
  Input,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui";
import ExcelActions from "@/components/ExcelActions";
import { NarnoliRatesDisplay } from "@/components/NarnoliRatesDisplay";
import { NarnoliDebugPanel } from "@/components/NarnoliDebugPanel";
import { EnhancedScrapingTestPanel } from "@/components/EnhancedScrapingTestPanel";
import BeautifulSoupTestPanel from "@/components/BeautifulSoupTestPanel";
import SPAScrapingTestPanel from "@/components/SPAScrapingTestPanel";
import PuppeteerTestPanel from "@/components/PuppeteerTestPanel";
import EnhancedPuppeteerRatesDisplay from "@/components/EnhancedPuppeteerRatesDisplay";
import PuppeteerLiveRatesWidget from "@/components/PuppeteerLiveRatesWidget";
import {
  PlusCircle,
  RefreshCw,
  Edit,
  Trash2,
  Store,
  LineChart,
  BarChart3,
  GoldBar,
  CoinSilver,
} from "lucide-react";

interface LocalRate {
  id: string;
  metal: "gold" | "silver";
  purity: string;
  rate: number;
  unit: string;
  lastUpdated: string;
}

export const EnhancedMetalRatesManager: React.FC = () => {
  const {
    rates: liveRates,
    loading,
    error,
    lastUpdated,
    refreshRates,
    success,
  } = useMetalRates();
  const [localRates, setLocalRates] = useState<LocalRate[]>([]);
  const [editingRate, setEditingRate] = useState<LocalRate | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeDebugTab, setActiveDebugTab] = useState<
    "live" | "legacy" | "enhanced" | "beautiful-soup" | "spa" | "puppeteer"
  >("live");
  const [formData, setFormData] = useState({
    metal: "gold" as "gold" | "silver",
    purity: "",
    rate: "",
    unit: "per gram",
  });

  // Load local rates from localStorage on component mount
  React.useEffect(() => {
    const saved = localStorage.getItem("localMetalRates");
    if (saved) {
      try {
        setLocalRates(JSON.parse(saved));
      } catch (error) {
        console.error("Failed to parse saved rates:", error);
      }
    }
  }, []);

  // Save local rates to localStorage
  const saveLocalRates = (rates: LocalRate[]) => {
    setLocalRates(rates);
    localStorage.setItem("localMetalRates", JSON.stringify(rates));
  };

  const handleAddRate = () => {
    if (!formData.purity || !formData.rate) return;

    const newRate: LocalRate = {
      id: Date.now().toString(),
      metal: formData.metal,
      purity: formData.purity,
      rate: parseFloat(formData.rate),
      unit: formData.unit,
      lastUpdated: new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      }),
    };

    saveLocalRates([...localRates, newRate]);
    setFormData({ metal: "gold", purity: "", rate: "", unit: "per gram" });
    setShowAddForm(false);
  };

  const handleEditRate = (rate: LocalRate) => {
    setEditingRate(rate);
    setFormData({
      metal: rate.metal,
      purity: rate.purity,
      rate: rate.rate.toString(),
      unit: rate.unit,
    });
  };

  const handleUpdateRate = () => {
    if (!editingRate || !formData.purity || !formData.rate) return;

    const updatedRates = localRates.map((rate) =>
      rate.id === editingRate.id
        ? {
            ...rate,
            metal: formData.metal,
            purity: formData.purity,
            rate: parseFloat(formData.rate),
            unit: formData.unit,
            lastUpdated: new Date().toLocaleString("en-IN", {
              timeZone: "Asia/Kolkata",
            }),
          }
        : rate
    );

    saveLocalRates(updatedRates);
    setEditingRate(null);
    setFormData({ metal: "gold", purity: "", rate: "", unit: "per gram" });
  };

  const handleDeleteRate = (id: string) => {
    if (confirm("Are you sure you want to delete this rate?")) {
      saveLocalRates(localRates.filter((rate) => rate.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({ metal: "gold", purity: "", rate: "", unit: "per gram" });
    setEditingRate(null);
    setShowAddForm(false);
  };

  // Handle Excel import
  const handleExcelImport = (importedRates: any[]) => {
    const mergedRates = [...localRates];
    let addedCount = 0;
    let updatedCount = 0;

    importedRates.forEach((importedRate) => {
      const existingIndex = mergedRates.findIndex(
        (r) =>
          r.metal === importedRate.metal && r.purity === importedRate.purity
      );

      if (existingIndex >= 0) {
        // Update existing rate
        mergedRates[existingIndex] = {
          ...mergedRates[existingIndex],
          ...importedRate,
          lastUpdated: new Date().toISOString(),
        };
        updatedCount++;
      } else {
        // Add new rate
        const newRate = {
          ...importedRate,
          id: importedRate.id || Date.now().toString(),
          lastUpdated: new Date().toISOString(),
        };
        mergedRates.push(newRate);
        addedCount++;
      }
    });

    setLocalRates(mergedRates);
    localStorage.setItem("metalRates", JSON.stringify(mergedRates));
    alert(
      `Import completed!\nAdded: ${addedCount} rates\nUpdated: ${updatedCount} rates`
    );
  };

  // Handle Dialog open state explicitly
  const isDialogOpen = showAddForm || !!editingRate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            <span className="inline-flex items-center">
              <BarChart3 className="w-6 h-6 mr-2" />
              Metal Rates Management
            </span>
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            Live rates from Narnoli Corporation and local rate management
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExcelActions
            type="rates"
            data={localRates}
            onImport={handleExcelImport}
            onExport={() => console.log("Metal rates exported")}
          />
          <Button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Add Custom Rate
          </Button>
        </div>
      </div>

      {/* PRIMARY: Live Rates from Narnoli Corporation (Puppeteer) */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
            <LineChart className="w-5 h-5 text-blue-700 dark:text-blue-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              Live Metal Rates - Narnoli Corporation
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Real-time rates extracted via Puppeteer server-side scraping
            </p>
          </div>
        </div>
        <EnhancedPuppeteerRatesDisplay />
      </div>

      {/* Secondary: Quick Live Rates Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PuppeteerLiveRatesWidget />

        {/* Legacy Live Rates (Jaipur Sarafa) */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
              <LineChart className="w-4 h-4 inline mr-1" /> Legacy Jaipur Sarafa
              Rates
            </h3>
            <Button
              onClick={refreshRates}
              disabled={loading}
              variant="secondary"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
                Loading...
              </span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
              <p className="text-red-800 dark:text-red-300 text-sm">
                Error: {error}
              </p>
            </div>
          )}

          {success && liveRates.length > 0 && (
            <div className="space-y-3">
              {liveRates.slice(0, 3).map((rate, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {rate.metal === "gold" ? (
                        <GoldBar className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                      ) : (
                        <CoinSilver className="w-5 h-5 text-zinc-400 dark:text-zinc-300" />
                      )}
                      <div>
                        <div className="font-medium text-zinc-900 dark:text-white capitalize text-sm">
                          {rate.metal} {rate.purity}
                        </div>
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          {rate.unit}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-yellow-600 dark:text-yellow-400">
                        ₹{rate.rate.toLocaleString()}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        Legacy Source
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {liveRates.length > 3 && (
                <p className="text-xs text-zinc-500 text-center">
                  +{liveRates.length - 3} more rates available
                </p>
              )}
            </div>
          )}

          {success && liveRates.length === 0 && (
            <div className="text-center py-6">
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                No legacy rates available
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Narnoli Corporation Live Rates */}
      <NarnoliRatesDisplay />

      {/* Custom Local Rates */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            <Store className="w-5 h-5 inline mr-1" /> Custom Local Rates
          </h2>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {localRates.length} custom rate{localRates.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Add/Edit Form Dialog */}
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open: boolean) => {
            if (!open) resetForm();
          }}
        >
          <DialogContent
            // fullScreen={true}
            className="overflow-y-auto bg-zinc-900 text-white"
          >
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-center">
                {editingRate ? "Edit Rate" : "Add New Rate"}
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Metal
                </label>
                <select
                  value={formData.metal}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      metal: e.target.value as "gold" | "silver",
                    })
                  }
                  className="w-full px-3 py-2 border border-zinc-700 rounded-md bg-zinc-800 text-white"
                >
                  <option value="gold">Gold</option>
                  <option value="silver">Silver</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Purity
                </label>
                <Input
                  value={formData.purity}
                  onChange={(e) =>
                    setFormData({ ...formData, purity: e.target.value })
                  }
                  placeholder="24K, 22K, 925, etc."
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Rate (₹)
                </label>
                <Input
                  type="number"
                  value={formData.rate}
                  onChange={(e) =>
                    setFormData({ ...formData, rate: e.target.value })
                  }
                  placeholder="0"
                  className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">
                  Unit
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-zinc-700 rounded-md bg-zinc-800 text-white"
                >
                  <option value="per gram">per gram</option>
                  <option value="per tola">per tola</option>
                  <option value="per ounce">per ounce</option>
                </select>
              </div>
            </div>

            <DialogFooter className="mt-8">
              <Button
                onClick={editingRate ? handleUpdateRate : handleAddRate}
                disabled={!formData.purity || !formData.rate}
                className="w-full sm:w-auto"
              >
                {editingRate ? "Update Rate" : "Add Rate"}
              </Button>
              <Button
                onClick={resetForm}
                variant="secondary"
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Custom Rates Grid */}
        {localRates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {localRates.map((rate) => (
              <div
                key={rate.id}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  {rate.metal === "gold" ? (
                    <GoldBar className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  ) : (
                    <CoinSilver className="w-6 h-6 text-zinc-400 dark:text-zinc-300" />
                  )}
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditRate(rate)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRate(rate.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-white capitalize">
                  {rate.metal} {rate.purity}
                </h3>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ₹{rate.rate.toLocaleString()}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {rate.unit}
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                  Updated: {rate.lastUpdated}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-zinc-500 dark:text-zinc-400 mb-4">
              No custom rates added yet
            </p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Add Your First Custom Rate
            </Button>
          </div>
        )}
      </Card>

      {/* Web Scraping & Debug Tools */}
      {/* <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 text-zinc-900 dark:text-white">
          🔧 Web Scraping & Debug Tools
        </h2>

       
        <div className="border-b border-zinc-200 dark:border-zinc-700 mb-6">
          <nav className="flex space-x-8">
            {[
              { id: "live", label: "Live Rates", icon: "📊" },
              { id: "puppeteer", label: "Puppeteer (Server)", icon: "🚀" },
              { id: "legacy", label: "Legacy Scraper", icon: "🔧" },
              { id: "enhanced", label: "Enhanced Scraper", icon: "🕷️" },
              { id: "beautiful-soup", label: "Beautiful Soup TS", icon: "🍲" },
              { id: "spa", label: "SPA Scraper", icon: "⚛️" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveDebugTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeDebugTab === tab.id
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

      
        {activeDebugTab === "live" && (
          <div className="space-y-6">
            <NarnoliRatesDisplay />
          </div>
        )}

        {activeDebugTab === "puppeteer" && (
          <div className="space-y-6">
            <PuppeteerTestPanel />
          </div>
        )}

        {activeDebugTab === "legacy" && (
          <div className="space-y-6">
            <NarnoliDebugPanel />
          </div>
        )}

        {activeDebugTab === "enhanced" && (
          <div className="space-y-6">
            <EnhancedScrapingTestPanel />
          </div>
        )}

        {activeDebugTab === "beautiful-soup" && (
          <div className="space-y-6">
            <BeautifulSoupTestPanel />
          </div>
        )}

        {activeDebugTab === "spa" && (
          <div className="space-y-6">
            <SPAScrapingTestPanel />
          </div>
        )}
      </Card> */}
    </div>
  );
};

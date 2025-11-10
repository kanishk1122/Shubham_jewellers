"use client";

import React, { useState, useEffect } from "react";
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
import EnhancedPuppeteerRatesDisplay from "@/components/EnhancedPuppeteerRatesDisplay";
import PuppeteerLiveRatesWidget from "@/components/PuppeteerLiveRatesWidget";
import axios from "axios";
import {
  PlusCircle,
  RefreshCw,
  Edit,
  Trash2,
  Store,
  LineChart,
  BarChart3,
  Coins,
} from "lucide-react";

interface LocalRate {
  _id?: string;
  id?: string;
  metal: "gold" | "silver";
  purity: string;
  rate: number;
  unit: string;
  source: string;
  lastUpdated?: string;
  createdAt?: string;
  updatedAt?: string;
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
  const [loadingRates, setLoadingRates] = useState(false);
  const [savingRate, setSavingRate] = useState(false);
  const [formData, setFormData] = useState({
    metal: "gold" as "gold" | "silver",
    purity: "",
    rate: "",
    unit: "per gram",
  });

  // Load rates from database on component mount
  useEffect(() => {
    loadRatesFromDB();
  }, []);

  const loadRatesFromDB = async () => {
    setLoadingRates(true);
    try {
      const response = await axios.get("/api/metal-rates");
      if (response.status === 200) {
        const result = response.data;
        if (result.success) {
          setLocalRates(result.data);
        }
      }
    } catch (error) {
      console.error("Failed to load rates from database:", error);
    } finally {
      setLoadingRates(false);
    }
  };

  const handleAddRate = async () => {
    if (!formData.purity || !formData.rate) return;

    setSavingRate(true);
    try {
      const newRateData = {
        metal: formData.metal,
        purity: formData.purity,
        rate: parseFloat(formData.rate),
        unit: formData.unit,
        source: "manual",
      };

      const response = await axios.post("/api/metal-rates", newRateData);

      if (response.status === 200) {
        const result = response.data;
        if (result.success) {
          setLocalRates([...localRates, result.data]);
          resetForm();
        }
      }
    } catch (error) {
      console.error("Failed to add rate:", error);
      alert("Failed to add rate. Please try again.");
    } finally {
      setSavingRate(false);
    }
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

  const handleUpdateRate = async () => {
    if (!editingRate || !formData.purity || !formData.rate) return;

    setSavingRate(true);
    try {
      const updateData = {
        metal: formData.metal,
        purity: formData.purity,
        rate: parseFloat(formData.rate),
        unit: formData.unit,
        source: "manual",
      };

      const rateId = editingRate._id || editingRate.id;
      const response = await axios.put(`/api/metal-rates/${rateId}`, updateData);

      if (response.status === 200) {
        const result = response.data;
        if (result.success) {
          setLocalRates(
            localRates.map((rate) =>
              (rate._id || rate.id) === rateId ? result.data : rate
            )
          );
          resetForm();
        }
      }
    } catch (error) {
      console.error("Failed to update rate:", error);
      alert("Failed to update rate. Please try again.");
    } finally {
      setSavingRate(false);
    }
  };

  const handleDeleteRate = async (rate: LocalRate) => {
    if (!confirm("Are you sure you want to delete this rate?")) return;

    try {
      const rateId = rate._id || rate.id;
      const response = await fetch(`/api/metal-rates/${rateId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setLocalRates(localRates.filter((r) => (r._id || r.id) !== rateId));
        }
      }
    } catch (error) {
      console.error("Failed to delete rate:", error);
      alert("Failed to delete rate. Please try again.");
    }
  };

  const resetForm = () => {
    setFormData({ metal: "gold", purity: "", rate: "", unit: "per gram" });
    setEditingRate(null);
    setShowAddForm(false);
  };

  // Handle Excel import - now saves to database
  const handleExcelImport = async (importedRates: any[]) => {
    try {
      const response = await fetch("/api/metal-rates/bulk-import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rates: importedRates }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          await loadRatesFromDB(); // Reload all rates
          alert(
            `Import completed!\nAdded: ${result.addedCount} rates\nUpdated: ${result.updatedCount} rates`
          );
        }
      }
    } catch (error) {
      console.error("Failed to import rates:", error);
      alert("Failed to import rates. Please try again.");
    }
  };

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

   

      {/* Secondary: Quick Live Rates Widget */}
     

      {/* Narnoli Corporation Live Rates */}
      <NarnoliRatesDisplay />

      {/* Custom Local Rates */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            <Store className="w-5 h-5 inline mr-1" /> Custom Local Rates
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {localRates.length} custom rate
              {localRates.length !== 1 ? "s" : ""}
            </span>
            <Button
              onClick={loadRatesFromDB}
              disabled={loadingRates}
              variant="secondary"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${loadingRates ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {loadingRates && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
              Loading rates from database...
            </span>
          </div>
        )}

        {/* Add/Edit Form Dialog */}
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open: boolean) => {
            if (!open) resetForm();
          }}
        >
          <DialogContent className="overflow-y-auto bg-zinc-900 text-white">
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
                  disabled={savingRate}
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
                  disabled={savingRate}
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
                  disabled={savingRate}
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
                  disabled={savingRate}
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
                disabled={!formData.purity || !formData.rate || savingRate}
                className="w-full sm:w-auto"
              >
                {savingRate ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    {editingRate ? "Updating..." : "Adding..."}
                  </>
                ) : editingRate ? (
                  "Update Rate"
                ) : (
                  "Add Rate"
                )}
              </Button>
              <Button
                onClick={resetForm}
                variant="secondary"
                className="w-full sm:w-auto"
                disabled={savingRate}
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Custom Rates Grid */}
        {!loadingRates && localRates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {localRates.map((rate) => (
              <div
                key={rate._id || rate.id}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <Coins className="w-6 h-6 text-zinc-400 dark:text-zinc-300" />

                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditRate(rate)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRate(rate)}
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
                <div className="mt-2 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded">
                    {rate.source}
                  </span>
                  <span>
                    {rate.updatedAt
                      ? new Date(rate.updatedAt).toLocaleDateString()
                      : rate.lastUpdated || "Unknown"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : !loadingRates ? (
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
        ) : null}
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

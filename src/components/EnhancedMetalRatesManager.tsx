"use client";

import React, { useState } from "react";
import { useMetalRates } from "@/services/metalRatesService";
import { Card, Input, Button } from "@/components/ui/enhanced";

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Metal Rates
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            Live rates from Jaipur Sarafa Market and custom local rates
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={refreshRates}
            disabled={loading}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <span className={loading ? "animate-spin" : ""}>🔄</span>
            Refresh Live Rates
          </Button>
          <Button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2"
          >
            <span>➕</span>
            Add Custom Rate
          </Button>
        </div>
      </div>

      {/* Live Rates from Jaipur Sarafa */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            🌟 Live Jaipur Sarafa Rates
          </h2>
          {lastUpdated && (
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              Last updated: {lastUpdated}
            </span>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-zinc-600 dark:text-zinc-400">
              Loading live rates...
            </span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-300">Error: {error}</p>
          </div>
        )}

        {success && liveRates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveRates.map((rate, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-2xl">
                    {rate.metal === "gold" ? "🥇" : "🥈"}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-800 px-2 py-1 rounded">
                    Live
                  </span>
                </div>
                <h3 className="font-semibold text-zinc-900 dark:text-white capitalize">
                  {rate.metal} {rate.purity}
                </h3>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  ₹{rate.rate.toLocaleString()}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {rate.unit}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Custom Local Rates */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            🏪 Custom Local Rates
          </h2>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {localRates.length} custom rate{localRates.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Add/Edit Form */}
        {(showAddForm || editingRate) && (
          <div className="bg-zinc-50 dark:bg-zinc-700 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-zinc-900 dark:text-white mb-3">
              {editingRate ? "Edit Rate" : "Add New Rate"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
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
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                >
                  <option value="gold">Gold</option>
                  <option value="silver">Silver</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Purity
                </label>
                <Input
                  value={formData.purity}
                  onChange={(e) =>
                    setFormData({ ...formData, purity: e.target.value })
                  }
                  placeholder="24K, 22K, 925, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Rate (₹)
                </label>
                <Input
                  type="number"
                  value={formData.rate}
                  onChange={(e) =>
                    setFormData({ ...formData, rate: e.target.value })
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Unit
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                >
                  <option value="per gram">per gram</option>
                  <option value="per tola">per tola</option>
                  <option value="per ounce">per ounce</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                onClick={editingRate ? handleUpdateRate : handleAddRate}
                disabled={!formData.purity || !formData.rate}
              >
                {editingRate ? "Update Rate" : "Add Rate"}
              </Button>
              <Button onClick={resetForm} variant="secondary">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Custom Rates Grid */}
        {localRates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {localRates.map((rate) => (
              <div
                key={rate.id}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-2xl">
                    {rate.metal === "gold" ? "🥇" : "🥈"}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditRate(rate)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteRate(rate.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1"
                      title="Delete"
                    >
                      🗑️
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
            <Button onClick={() => setShowAddForm(true)}>
              Add Your First Custom Rate
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

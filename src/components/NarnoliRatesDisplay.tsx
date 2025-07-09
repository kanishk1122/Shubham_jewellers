"use client";

import React, { useState, useEffect } from "react";
import { Card, Button } from "@/components/ui/enhanced";
import {
  narnoliCorporationService,
  type NarnoliRatesData,
  type MetalRate,
  type GoldAuctionRate,
  type SpotRate,
} from "@/services/narnolicorporationService";

export const NarnoliRatesDisplay: React.FC = () => {
  const [rates, setRates] = useState<NarnoliRatesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string>("");

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    setLoading(true);
    try {
      const data = await narnoliCorporationService.getRatesWithCache();
      setRates(data);
      setLastRefresh(
        new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        })
      );
    } catch (error) {
      console.error("Failed to load rates:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshRates = async () => {
    setLoading(true);
    try {
      const data = await narnoliCorporationService.fetchLiveRates();
      setRates(data);
      setLastRefresh(
        new Date().toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
        })
      );
    } catch (error) {
      console.error("Failed to refresh rates:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-IN").format(value);
  };

  if (!rates) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
              Loading Narnoli Corporation Rates
            </h3>
            <Button onClick={loadRates} disabled={loading}>
              {loading ? "Loading..." : "Load Rates"}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return null;
};

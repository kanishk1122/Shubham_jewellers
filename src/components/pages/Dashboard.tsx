"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext"; // new
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
} from "recharts";
import { Card, Button, Input } from "@/components/ui/enhanced";
import {
  ArrowRight,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  DollarSign,
  Zap,
  BarChart2,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import PuppeteerQuickRatesWidget from "@/components/PuppeteerQuickRatesWidget";
import axios from "axios";

// Define color schemes for consistency
const COLORS = {
  primary: "#3b82f6",
  secondary: "#f59e0b",
  tertiary: "#10b981",
  accent: "#8b5cf6",
  error: "#ef4444",
  success: "#22c55e",
  warning: "#f97316",
  gradientFrom: "rgba(59, 130, 246, 0.5)",
  gradientTo: "rgba(59, 130, 246, 0.05)",
};

// Pie chart colors
const PIE_COLORS = [
  "#3b82f6",
  "#f59e0b",
  "#10b981",
  "#8b5cf6",
  "#ef4444",
  "#64748b",
];

export const Dashboard: React.FC = () => {
  const router = useRouter();
  const auth = useAuth(); // new

  // State for date range filter
  const [dateRange, setDateRange] = useState<
    "7d" | "30d" | "90d" | "1y" | "custom"
  >("30d");
  const [customDateStart, setCustomDateStart] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [customDateEnd, setCustomDateEnd] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Data loading and refresh states
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Analytics data states
  const [recentBills, setRecentBills] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  // Analytics derived metrics
  const [salesThisWeek, setSalesThisWeek] = useState<number>(0);
  const [salesLastWeek, setSalesLastWeek] = useState<number>(0);
  const [salesThisMonth, setSalesThisMonth] = useState<number>(0);
  const [salesLastMonth, setSalesLastMonth] = useState<number>(0);
  const [weekGrowthPct, setWeekGrowthPct] = useState<number | null>(null);
  const [monthGrowthPct, setMonthGrowthPct] = useState<number | null>(null);
  const [customersThisWeek, setCustomersThisWeek] = useState<number>(0);
  const [customersLastWeek, setCustomersLastWeek] = useState<number>(0);
  const [customersThisMonth, setCustomersThisMonth] = useState<number>(0);
  const [customersLastMonth, setCustomersLastMonth] = useState<number>(0);
  const [customerWeekGrowthPct, setCustomerWeekGrowthPct] = useState<
    number | null
  >(null);
  const [customerMonthGrowthPct, setCustomerMonthGrowthPct] = useState<
    number | null
  >(null);

  // Function to calculate date range based on selection
  const getDateRange = () => {
    const end = new Date();
    let start = new Date();

    switch (dateRange) {
      case "7d":
        start.setDate(end.getDate() - 7);
        break;
      case "30d":
        start.setDate(end.getDate() - 30);
        break;
      case "90d":
        start.setDate(end.getDate() - 90);
        break;
      case "1y":
        start.setFullYear(end.getFullYear() - 1);
        break;
      case "custom":
        return {
          start: new Date(customDateStart),
          end: new Date(customDateEnd),
        };
      default:
        start.setDate(end.getDate() - 30);
    }

    return { start, end };
  };

  // Refresh all analytics data
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetchBills(), fetchCustomers()]);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error refreshing dashboard data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initialize and fetch data on component mount
  useEffect(() => {
    refreshData();
  }, []);

  // Refetch data when date range changes
  useEffect(() => {
    refreshData();
  }, [dateRange, customDateStart, customDateEnd]);

  // Fetch bills based on date range
  const fetchBills = async () => {
    try {
      const { start, end } = getDateRange();
      const qs = new URLSearchParams({
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
        limit: "1000",
      });

      const headers: any = {};
      if (auth?.token) headers.Authorization = `Bearer ${auth.token}`;
      const res = await axios.get(`/api/bills?${qs.toString()}`, { headers });
      const data = res.data;

      if (!data.success) throw new Error(data.error || "Failed to fetch bills");

      const bills: any[] = Array.isArray(data.data) ? data.data : [];
      setRecentBills(bills);

      // Calculate metrics
      calculateSalesMetrics(bills);
    } catch (err) {
      console.error("Failed to fetch bills for analysis:", err);
    }
  };

  // Fetch customers
  const fetchCustomers = async () => {
    try {
      const { start, end } = getDateRange();
      const qs = new URLSearchParams({
        limit: "1000",
      });

      const headers: any = { "Content-Type": "application/json" };
      if (auth?.token) headers.Authorization = `Bearer ${auth.token}`;
      const res = await axios.get(`/api/customers?${qs.toString()}`, { headers });
      const data = res.data;

      if (!data.success)
        throw new Error(data.error || "Failed to fetch customers");

      const customers: any[] = Array.isArray(data.data) ? data.data : [];
      setCustomers(customers);

      // Calculate customer metrics
      calculateCustomerMetrics(customers);
    } catch (err) {
      console.error("Failed to fetch customers for analysis:", err);
    }
  };

  // Calculate sales-related metrics from bills data
  const calculateSalesMetrics = (bills: any[]) => {
    const now = new Date();

    // Helper functions for date ranges
    const startOfWeek = (d: Date) => {
      const dt = new Date(d);
      const day = dt.getDay();
      dt.setHours(0, 0, 0, 0);
      dt.setDate(dt.getDate() - day);
      return dt;
    };

    const endOfWeek = (d: Date) => {
      const s = startOfWeek(d);
      const e = new Date(s);
      e.setDate(s.getDate() + 6);
      e.setHours(23, 59, 59, 999);
      return e;
    };

    const startOfMonth = (d: Date) => {
      return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
    };

    const endOfMonth = (d: Date) => {
      return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    };

    // Current periods
    const currWeekStart = startOfWeek(now);
    const currWeekEnd = endOfWeek(now);
    const lastWeekStart = new Date(currWeekStart);
    lastWeekStart.setDate(currWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(currWeekEnd);
    lastWeekEnd.setDate(currWeekEnd.getDate() - 7);

    const currMonthStart = startOfMonth(now);
    const currMonthEnd = endOfMonth(now);
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStart = startOfMonth(lastMonthDate);
    const lastMonthEnd = endOfMonth(lastMonthDate);

    // Calculate sums
    let sumThisWeek = 0;
    let sumLastWeek = 0;
    let sumThisMonth = 0;
    let sumLastMonth = 0;

    for (const bill of bills) {
      const billDate = new Date(bill.date);
      const amount = parseFloat(bill.finalAmount || "0") || 0;

      if (billDate >= currWeekStart && billDate <= currWeekEnd)
        sumThisWeek += amount;
      if (billDate >= lastWeekStart && billDate <= lastWeekEnd)
        sumLastWeek += amount;
      if (billDate >= currMonthStart && billDate <= currMonthEnd)
        sumThisMonth += amount;
      if (billDate >= lastMonthStart && billDate <= lastMonthEnd)
        sumLastMonth += amount;
    }

    // Update state
    setSalesThisWeek(sumThisWeek);
    setSalesLastWeek(sumLastWeek);
    setSalesThisMonth(sumThisMonth);
    setSalesLastMonth(sumLastMonth);

    // Calculate growth percentages
    const safePct = (curr: number, prev: number) =>
      prev === 0 ? null : Math.round(((curr - prev) / prev) * 100 * 100) / 100;

    setWeekGrowthPct(safePct(sumThisWeek, sumLastWeek));
    setMonthGrowthPct(safePct(sumThisMonth, sumLastMonth));
  };

  // Calculate customer metrics
  const calculateCustomerMetrics = (customerList: any[]) => {
    const now = new Date();

    // Helper functions for date ranges (same as above)
    const startOfWeek = (d: Date) => {
      const dt = new Date(d);
      const day = dt.getDay();
      dt.setHours(0, 0, 0, 0);
      dt.setDate(dt.getDate() - day);
      return dt;
    };

    const endOfWeek = (d: Date) => {
      const s = startOfWeek(d);
      const e = new Date(s);
      e.setDate(s.getDate() + 6);
      e.setHours(23, 59, 59, 999);
      return e;
    };

    const startOfMonth = (d: Date) => {
      return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
    };

    const endOfMonth = (d: Date) => {
      return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    };

    // Current periods
    const currWeekStart = startOfWeek(now);
    const currWeekEnd = endOfWeek(now);
    const lastWeekStart = new Date(currWeekStart);
    lastWeekStart.setDate(currWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(currWeekEnd);
    lastWeekEnd.setDate(currWeekEnd.getDate() - 7);

    const currMonthStart = startOfMonth(now);
    const currMonthEnd = endOfMonth(now);
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStart = startOfMonth(lastMonthDate);
    const lastMonthEnd = endOfMonth(lastMonthDate);

    // Count new customers by creation date
    let newThisWeek = 0;
    let newLastWeek = 0;
    let newThisMonth = 0;
    let newLastMonth = 0;

    for (const customer of customerList) {
      if (!customer.createdAt) continue;
      const createdDate = new Date(customer.createdAt);

      if (createdDate >= currWeekStart && createdDate <= currWeekEnd)
        newThisWeek++;
      if (createdDate >= lastWeekStart && createdDate <= lastWeekEnd)
        newLastWeek++;
      if (createdDate >= currMonthStart && createdDate <= currMonthEnd)
        newThisMonth++;
      if (createdDate >= lastMonthStart && createdDate <= lastMonthEnd)
        newLastMonth++;
    }

    // Update state
    setCustomersThisWeek(newThisWeek);
    setCustomersLastWeek(newLastWeek);
    setCustomersThisMonth(newThisMonth);
    setCustomersLastMonth(newLastMonth);

    // Calculate growth percentages
    const safePct = (curr: number, prev: number) =>
      prev === 0 ? null : Math.round(((curr - prev) / prev) * 100 * 100) / 100;

    setCustomerWeekGrowthPct(safePct(newThisWeek, newLastWeek));
    setCustomerMonthGrowthPct(safePct(newThisMonth, newLastMonth));
  };

  // Generate daily sales data for charts
  const dailySalesData = useMemo(() => {
    const { start, end } = getDateRange();
    const dateMap = new Map<string, number>();

    // Initialize all dates in the range with zero
    const dayMillis = 24 * 60 * 60 * 1000;
    for (
      let d = new Date(start);
      d <= end;
      d = new Date(d.getTime() + dayMillis)
    ) {
      const dateKey = d.toISOString().split("T")[0];
      dateMap.set(dateKey, 0);
    }

    // Fill in actual sales data
    for (const bill of recentBills) {
      const dateKey = new Date(bill.date).toISOString().split("T")[0];
      if (dateMap.has(dateKey)) {
        dateMap.set(
          dateKey,
          (dateMap.get(dateKey) || 0) + (parseFloat(bill.finalAmount) || 0)
        );
      }
    }

    // Convert to array format for charts
    return Array.from(dateMap.entries())
      .map(([date, value]) => ({
        date,
        value: Math.round(value * 100) / 100,
        displayDate: new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [recentBills]);

  // Generate monthly sales data (aggregated by month)
  const monthlySalesData = useMemo(() => {
    const monthMap = new Map<string, number>();

    for (const bill of recentBills) {
      const date = new Date(bill.date);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      const amount = parseFloat(bill.finalAmount) || 0;
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + amount);
    }

    return Array.from(monthMap.entries())
      .map(([monthKey, value]) => {
        const [year, month] = monthKey.split("-").map((v) => parseInt(v, 10));
        return {
          month: monthKey,
          value: Math.round(value * 100) / 100,
          displayMonth: new Date(year, month - 1).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
        };
      })
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [recentBills]);

  // Sales by category (pie chart data)
  const salesByCategoryData = useMemo(() => {
    const categoryMap = new Map<string, number>();

    for (const bill of recentBills) {
      for (const item of bill.items || []) {
        const category = item.category || "Unknown";
        const amount = parseFloat(item.amount) || 0;
        categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
      }
    }

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({
        name,
        value: Math.round(value * 100) / 100,
      }))
      .sort((a, b) => b.value - a.value); // Sort by value descending
  }, [recentBills]);

  // Customer signup trends
  const customerSignupData = useMemo(() => {
    const { start, end } = getDateRange();
    const dateMap = new Map<string, number>();

    // Initialize all dates in the range with zero
    const dayMillis = 24 * 60 * 60 * 1000;
    for (
      let d = new Date(start);
      d <= end;
      d = new Date(d.getTime() + dayMillis)
    ) {
      const dateKey = d.toISOString().split("T")[0];
      dateMap.set(dateKey, 0);
    }

    // Count signups by date
    for (const customer of customers) {
      if (!customer.createdAt) continue;
      const dateKey = new Date(customer.createdAt).toISOString().split("T")[0];
      if (dateMap.has(dateKey)) {
        dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + 1);
      }
    }

    return Array.from(dateMap.entries())
      .map(([date, count]) => ({
        date,
        count,
        displayDate: new Date(date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [customers]);

  // Sales prediction (same code as before)
  const projection = useMemo(() => {
    if (!dailySalesData.length)
      return { predictedMonthTotal: null, details: null };

    // Simple linear regression
    const data = dailySalesData.slice(-30); // Use last 30 days for better prediction
    const ys = data.map((d) => d.value);
    const xs = data.map((_, i) => i + 1);
    const n = xs.length;

    const sumX = xs.reduce((s, v) => s + v, 0);
    const sumY = ys.reduce((s, v) => s + v, 0);
    const sumXY = xs.reduce((s, v, i) => s + v * ys[i], 0);
    const sumXX = xs.reduce((s, v) => s + v * v, 0);

    const denom = n * sumXX - sumX * sumX;
    let b = 0;
    let a = sumY / n;

    if (denom !== 0) {
      b = (n * sumXY - sumX * sumY) / denom;
      a = (sumY - b * sumX) / n;
    }

    // Current month totals and remaining days
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const daysInMonth = monthEnd.getDate();
    const dayOfMonth = now.getDate();
    const daysRemaining = daysInMonth - dayOfMonth;

    let currentMonthTotal = 0;
    for (const bill of recentBills) {
      const d = new Date(bill.date);
      if (d >= monthStart && d <= now) {
        currentMonthTotal += parseFloat(bill.finalAmount) || 0;
      }
    }

    // Predict remaining days
    let predictedRemaining = 0;
    for (let k = 1; k <= daysRemaining; k++) {
      const x = n + k;
      const predicted = Math.max(0, a + b * x);
      predictedRemaining += predicted;
    }

    const predictedMonthTotal =
      Math.round((currentMonthTotal + predictedRemaining) * 100) / 100;

    return {
      predictedMonthTotal,
      details: {
        a,
        b,
        currentMonthTotal,
        predictedRemaining,
        daysRemaining,
        trendUp: b > 0,
        confidence: Math.min(100, Math.max(0, (n / 30) * 100)),
      },
    };
  }, [dailySalesData, recentBills]);

  // Format currency value
  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString("en-IN")}`;
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header with Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-zinc-800 rounded-xl p-4 shadow-sm border border-zinc-200 dark:border-zinc-700">
        <div className="mb-4 md:mb-0">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Analytics Dashboard
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Last updated: {lastUpdated.toLocaleString()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date Range Filter */}
          <div className="flex items-center border border-zinc-200 dark:border-zinc-600 rounded-lg overflow-hidden">
            <Button
              variant={dateRange === "7d" ? "primary" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setDateRange("7d")}
            >
              7D
            </Button>
            <Button
              variant={dateRange === "30d" ? "primary" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setDateRange("30d")}
            >
              30D
            </Button>
            <Button
              variant={dateRange === "90d" ? "primary" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setDateRange("90d")}
            >
              90D
            </Button>
            <Button
              variant={dateRange === "1y" ? "primary" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setDateRange("1y")}
            >
              1Y
            </Button>
            <Button
              variant={dateRange === "custom" ? "primary" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setDateRange("custom")}
            >
              <Calendar className="h-4 w-4" />
            </Button>
          </div>

          {/* Custom Date Range */}
          {dateRange === "custom" && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={customDateStart}
                onChange={(e) => setCustomDateStart(e.target.value)}
                className="w-36 h-9 px-2"
              />
              <span className="text-zinc-500">to</span>
              <Input
                type="date"
                value={customDateEnd}
                onChange={(e) => setCustomDateEnd(e.target.value)}
                className="w-36 h-9 px-2"
              />
            </div>
          )}

          {/* Refresh Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshData}
            disabled={isRefreshing}
            className="ml-2"
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sales This Week */}
        <Card className="p-5 border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Sales This Week
              </p>
              <h3 className="text-2xl font-bold mt-1">
                {formatCurrency(salesThisWeek)}
              </h3>
              <div className="flex items-center gap-1 mt-1">
                {weekGrowthPct !== null && (
                  <>
                    {weekGrowthPct > 0 ? (
                      <span className="flex items-center text-green-500 text-xs font-medium">
                        <TrendingUp className="h-3 w-3 mr-1" />+{weekGrowthPct}%
                      </span>
                    ) : (
                      <span className="flex items-center text-red-500 text-xs font-medium">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        {weekGrowthPct}%
                      </span>
                    )}
                    <span className="text-zinc-400 text-xs ml-1">
                      vs last week
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="mt-4 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailySalesData.slice(-7)}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Sales This Month */}
        <Card className="p-5 border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Sales This Month
              </p>
              <h3 className="text-2xl font-bold mt-1">
                {formatCurrency(salesThisMonth)}
              </h3>
              <div className="flex items-center gap-1 mt-1">
                {monthGrowthPct !== null && (
                  <>
                    {monthGrowthPct > 0 ? (
                      <span className="flex items-center text-green-500 text-xs font-medium">
                        <TrendingUp className="h-3 w-3 mr-1" />+{monthGrowthPct}
                        %
                      </span>
                    ) : (
                      <span className="flex items-center text-red-500 text-xs font-medium">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        {monthGrowthPct}%
                      </span>
                    )}
                    <span className="text-zinc-400 text-xs ml-1">
                      vs last month
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <BarChart2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="mt-4 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailySalesData.slice(-30)}>
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={COLORS.tertiary}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* New Customers */}
        <Card className="p-5 border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                New Customers (Month)
              </p>
              <h3 className="text-2xl font-bold mt-1">+{customersThisMonth}</h3>
              <div className="flex items-center gap-1 mt-1">
                {customerMonthGrowthPct !== null && (
                  <>
                    {customerMonthGrowthPct > 0 ? (
                      <span className="flex items-center text-green-500 text-xs font-medium">
                        <TrendingUp className="h-3 w-3 mr-1" />+
                        {customerMonthGrowthPct}%
                      </span>
                    ) : (
                      <span className="flex items-center text-red-500 text-xs font-medium">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        {customerMonthGrowthPct}%
                      </span>
                    )}
                    <span className="text-zinc-400 text-xs ml-1">
                      vs last month
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="mt-4 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={customerSignupData.slice(-30)}>
                <Bar
                  dataKey="count"
                  fill={COLORS.accent}
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Monthly Projection */}
        <Card className="p-5 border border-zinc-200 dark:border-zinc-700 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Month-End Projection
              </p>
              <h3 className="text-2xl font-bold mt-1">
                {projection.predictedMonthTotal === null
                  ? "Calculating..."
                  : formatCurrency(projection.predictedMonthTotal)}
              </h3>
              <div className="flex items-center gap-1 mt-1">
                {projection.details && (
                  <>
                    {projection.details.trendUp ? (
                      <span className="flex items-center text-green-500 text-xs font-medium">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Upward trend
                      </span>
                    ) : (
                      <span className="flex items-center text-red-500 text-xs font-medium">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        Downward trend
                      </span>
                    )}
                    <span className="text-zinc-400 text-xs ml-1">
                      {projection.details.daysRemaining} days left
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <Zap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          {projection.details && (
            <div className="mt-4 flex items-center gap-2">
              <div className="h-2 flex-1 bg-zinc-100 dark:bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, projection.details.confidence)
                    )}%`,
                  }}
                />
              </div>
              <span className="text-xs text-zinc-500">
                {Math.round(projection.details.confidence)}% confidence
              </span>
            </div>
          )}
        </Card>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Chart (Larger) */}
        <Card className="p-6 border border-zinc-200 dark:border-zinc-700 col-span-2 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Sales Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dailySalesData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={COLORS.primary}
                      stopOpacity={0.1}
                    />
                    <stop
                      offset="95%"
                      stopColor={COLORS.primary}
                      stopOpacity={0.0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  tickFormatter={(val, idx) => {
                    // Show every nth label depending on data length to prevent overcrowding
                    const skipFactor =
                      dailySalesData.length > 60
                        ? 7
                        : dailySalesData.length > 30
                        ? 5
                        : 3;
                    return idx % skipFactor === 0 ? val : "";
                  }}
                />
                <YAxis />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(value), "Sales"]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  fill="url(#colorValue)"
                  dot={false}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 8 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Sales by Category - Pie Chart */}
        <Card className="p-6 border border-zinc-200 dark:border-zinc-700 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Sales by Category</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salesByCategoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {salesByCategoryData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Legend
                  layout="vertical"
                  verticalAlign="bottom"
                  align="center"
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Secondary Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Performance */}
        <Card className="p-6 border border-zinc-200 dark:border-zinc-700 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Monthly Performance</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySalesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="displayMonth" />
                <YAxis />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Bar
                  dataKey="value"
                  name="Sales"
                  fill={COLORS.tertiary}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Customer Growth */}
        <Card className="p-6 border border-zinc-200 dark:border-zinc-700 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">
            Customer Acquisition Trend
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={customerSignupData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="displayDate"
                  tickFormatter={(val, idx) => {
                    const skipFactor =
                      customerSignupData.length > 60
                        ? 7
                        : customerSignupData.length > 30
                        ? 5
                        : 3;
                    return idx % skipFactor === 0 ? val : "";
                  }}
                />
                <YAxis allowDecimals={false} />
                <Tooltip
                  formatter={(value: any) => [value, "New Customers"]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={COLORS.accent}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Quick Actions Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="col-span-2 p-6 border border-zinc-200 dark:border-zinc-700 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="secondary"
              className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              onClick={() => router.push("/billing")}
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-2">
                <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-left">
                <h4 className="font-medium mb-1">Create New Bill</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Start billing process for customers
                </p>
              </div>
              <ChevronRight className="h-4 w-4 self-end mt-2 text-zinc-400" />
            </Button>

            <Button
              variant="secondary"
              className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              onClick={() => router.push("/products")}
            >
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-2">
                <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-left">
                <h4 className="font-medium mb-1">Manage Products</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Add and update jewelry items
                </p>
              </div>
              <ChevronRight className="h-4 w-4 self-end mt-2 text-zinc-400" />
            </Button>

            <Button
              variant="secondary"
              className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              onClick={() => router.push("/customers")}
            >
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-left">
                <h4 className="font-medium mb-1">Manage Customers</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  View and edit your customer database
                </p>
              </div>
              <ChevronRight className="h-4 w-4 self-end mt-2 text-zinc-400" />
            </Button>
          </div>

          <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            <Button
              variant="ghost"
              onClick={() => router.push("/bills")}
              className="flex items-center gap-1 text-blue-600 dark:text-blue-400 px-0"
            >
              View All Activity
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>

        {/* Metal Rates Card */}
        <Card className="p-6 border border-zinc-200 dark:border-zinc-700 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Live Metal Rates</h3>
          <div className="h-[280px] overflow-auto">
            <PuppeteerQuickRatesWidget />
          </div>
        </Card>
      </div>
    </div>
  );
};

"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { QuickRatesWidget } from "@/components/QuickRatesWidget";
import { LiveMetalRatesWidget } from "@/components/LiveMetalRatesWidget";
import PuppeteerLiveRatesWidget from "@/components/PuppeteerLiveRatesWidget";
import EnhancedPuppeteerRatesDisplay from "@/components/EnhancedPuppeteerRatesDisplay";
import PuppeteerQuickRatesWidget from "@/components/PuppeteerQuickRatesWidget";

interface DashboardProps {}

interface Product {
  id: string;
  name: string;
  weight: number;
}

interface Customer {
  id: string;
  name: string;
  totalPurchases: number;
}

export const Dashboard: React.FC<DashboardProps> = () => {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    // Load real data from localStorage
    const savedProducts = localStorage.getItem("products");
    const savedCustomers = localStorage.getItem("customers");

    if (savedProducts) {
      try {
        setProducts(JSON.parse(savedProducts));
      } catch (error) {
        console.error("Failed to parse products:", error);
      }
    }

    if (savedCustomers) {
      try {
        setCustomers(JSON.parse(savedCustomers));
      } catch (error) {
        console.error("Failed to parse customers:", error);
      }
    }
  }, []);

  const totalProducts = products.length;
  const totalCustomers = customers.length;
  const totalWeight = products.reduce(
    (sum, product) => sum + product.weight,
    0
  );
  const totalSales = customers.reduce(
    (sum, customer) => sum + customer.totalPurchases,
    0
  );

  const quickStats = [
    {
      label: "Total Sales",
      value: `₹${totalSales.toLocaleString()}`,
      change: totalSales > 0 ? "+100%" : "0%",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      icon: "📈",
    },
    {
      label: "Total Products",
      value: totalProducts.toString(),
      change: totalProducts > 0 ? `+${totalProducts}` : "0",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      icon: "💍",
    },
    {
      label: "Total Customers",
      value: totalCustomers.toString(),
      change: totalCustomers > 0 ? `+${totalCustomers}` : "0",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      icon: "👥",
    },
    {
      label: "Total Weight",
      value: `${totalWeight.toFixed(2)}g`,
      change: totalWeight > 0 ? `+${totalWeight.toFixed(1)}g` : "0g",
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      icon: "⚖️",
    },
  ];

  const getStartedActions = [
    {
      title: "Add Your First Product",
      description: "Start by adding jewelry items to your inventory",
      icon: "💍",
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
      action: () => router.push("/products"),
      show: totalProducts === 0,
    },
    {
      title: "Add Your First Customer",
      description: "Build your customer database",
      icon: "👥",
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      action: () => router.push("/customers"),
      show: totalCustomers === 0,
    },
    {
      title: "Check Live Metal Rates",
      description:
        "View real-time gold and silver rates from Narnoli Corporation",
      icon: "💰",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50 dark:bg-yellow-900/20",
      action: () => router.push("/rates"),
      show: true,
    },
    {
      title: "Create Your First Bill",
      description: "Start billing customers for jewelry purchases",
      icon: "🧾",
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
      action: () => router.push("/billing"),
      show: totalProducts > 0 && totalCustomers > 0,
    },
  ];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-700 dark:to-purple-700 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome back, Admin! 👋</h1>
            <p className="opacity-90">
              Here's what's happening at Shubham Jewellers today
            </p>
          </div>
          <div className="text-6xl opacity-20">✨</div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => (
          <div
            key={index}
            className="bg-white dark:bg-zinc-800 rounded-lg p-6 border border-zinc-200 dark:border-zinc-700 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">
                  {stat.value}
                </p>
                <p className={`text-sm ${stat.color} mt-1`}>
                  {stat.change} from yesterday
                </p>
              </div>
              <div
                className={`w-12 h-12 ${stat.bgColor} rounded-full flex items-center justify-center`}
              >
                <span className="text-xl">{stat.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Live Metal Rates from Puppeteer */}
      <EnhancedPuppeteerRatesDisplay />

      {/* Quick Actions */}
      <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push("/billing")}
            className="group p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg border border-green-200 dark:border-green-700 hover:shadow-md transition-all duration-200"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
              🧾
            </div>
            <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">
              Create New Bill
            </h4>
            <p className="text-sm text-green-600 dark:text-green-400">
              Start billing process for customers
            </p>
          </button>

          <button
            onClick={() => router.push("/products")}
            className="group p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg border border-purple-200 dark:border-purple-700 hover:shadow-md transition-all duration-200"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
              💍
            </div>
            <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-2">
              Manage Products
            </h4>
            <p className="text-sm text-purple-600 dark:text-purple-400">
              Add and update jewelry items
            </p>
          </button>

          <button
            onClick={() => router.push("/rates")}
            className="group p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg border border-yellow-200 dark:border-yellow-700 hover:shadow-md transition-all duration-200"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">
              💰
            </div>
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
              Live Metal Rates
            </h4>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              View live rates from Narnoli Corporation
            </p>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Getting Started / Quick Actions */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg p-6 border border-zinc-200 dark:border-zinc-700 shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
            {totalProducts === 0 || totalCustomers === 0
              ? "Getting Started"
              : "Quick Actions"}
          </h3>
          <div className="space-y-4">
            {getStartedActions
              .filter((action) => action.show)
              .map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className={`w-full flex items-start space-x-3 p-4 rounded-lg ${action.bgColor} border border-zinc-200 dark:border-zinc-600 hover:shadow-md transition-all duration-200 text-left`}
                >
                  <div className="text-2xl">{action.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        action.color
                      } dark:${action.color.replace("600", "400")}`}
                    >
                      {action.title}
                    </p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {action.description}
                    </p>
                  </div>
                  <div className="text-zinc-400 dark:text-zinc-500">→</div>
                </button>
              ))}
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-600">
            <button
              onClick={() => router.push("/bills")}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
            >
              View All Activity →
            </button>
          </div>
        </div>

        {/* Additional Rate Tools & Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PuppeteerQuickRatesWidget />
          <LiveMetalRatesWidget />
        </div>
      </div>
    </div>
  );
};

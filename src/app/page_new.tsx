"use client";

import React, { useState } from "react";
import { BillingSystem } from "@/components/BillingSystem";
import { ProductList } from "@/components/ProductManager";
import { CustomerList } from "@/components/CustomerManager";
import { BillHistory } from "@/components/BillHistory";
import { MetalRatesManager } from "@/components/MetalRatesManager";
import { Button, Card } from "@/components/ui";

type TabType =
  | "billing"
  | "products"
  | "customers"
  | "bills"
  | "rates"
  | "dashboard";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

  const tabs = [
    { id: "dashboard" as TabType, label: "Dashboard", icon: "📊" },
    { id: "billing" as TabType, label: "New Bill", icon: "🧾" },
    { id: "products" as TabType, label: "Products", icon: "💍" },
    { id: "customers" as TabType, label: "Customers", icon: "👥" },
    { id: "bills" as TabType, label: "Bills History", icon: "📋" },
    { id: "rates" as TabType, label: "Metal Rates", icon: "💰" },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "billing":
        return <BillingSystem />;
      case "products":
        return <ProductList />;
      case "customers":
        return <CustomerList />;
      case "bills":
        return <BillHistory />;
      case "rates":
        return <MetalRatesManager />;
      case "dashboard":
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                ✨ Shubham Jewellers
              </h1>
              <p className="text-sm text-gray-600">
                Jewelry Billing & Management System
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Welcome back!</p>
              <p className="text-xs text-gray-500">
                {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="px-6">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-6 py-6">{renderContent()}</main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="px-6 py-4 text-center text-sm text-gray-600">
          <p>&copy; 2025 Shubham Jewellers. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

interface DashboardProps {
  setActiveTab: (tab: TabType) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to Shubham Jewellers
        </h2>
        <p className="text-gray-600">
          Complete jewelry billing and management solution
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          className="text-center hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setActiveTab("billing")}
        >
          <Card>
            <div className="p-6">
              <div className="text-4xl mb-4">🧾</div>
              <h3 className="text-lg font-semibold mb-2">Create New Bill</h3>
              <p className="text-gray-600 text-sm mb-4">
                Generate bills with automatic calculations for gold, silver, and
                platinum jewelry
              </p>
              <Button>Start Billing</Button>
            </div>
          </Card>
        </div>

        <div
          className="text-center hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setActiveTab("products")}
        >
          <Card>
            <div className="p-6">
              <div className="text-4xl mb-4">💍</div>
              <h3 className="text-lg font-semibold mb-2">Manage Products</h3>
              <p className="text-gray-600 text-sm mb-4">
                Add and manage jewelry products with detailed specifications and
                pricing
              </p>
              <Button>View Products</Button>
            </div>
          </Card>
        </div>

        <div
          className="text-center hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setActiveTab("rates")}
        >
          <Card>
            <div className="p-6">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="text-lg font-semibold mb-2">Metal Rates</h3>
              <p className="text-gray-600 text-sm mb-4">
                Update and track current market rates for gold, silver, and
                platinum
              </p>
              <Button>Update Rates</Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <Card className="p-4">
          <div className="flex items-center">
            <div className="text-2xl mr-3">⚖️</div>
            <div>
              <h4 className="font-semibold">Precise Weight Calculations</h4>
              <p className="text-sm text-gray-600">
                Accurate calculations for all jewelry items
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="text-2xl mr-3">💎</div>
            <div>
              <h4 className="font-semibold">Stone Management</h4>
              <p className="text-sm text-gray-600">
                Track diamonds, gems, and precious stones
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="text-2xl mr-3">📊</div>
            <div>
              <h4 className="font-semibold">GST Compliance</h4>
              <p className="text-sm text-gray-600">
                Automatic GST calculations and reporting
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center">
            <div className="text-2xl mr-3">🖨️</div>
            <div>
              <h4 className="font-semibold">Professional Bills</h4>
              <p className="text-sm text-gray-600">
                Generate and print professional invoices
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Material Types */}
      <Card title="Supported Materials & Purities">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-semibold text-yellow-600 mb-2">🟡 Gold</h4>
            <ul className="text-sm space-y-1">
              <li>• 24K (99.9% Pure)</li>
              <li>• 22K (91.6% Pure)</li>
              <li>• 21K (87.5% Pure)</li>
              <li>• 18K (75.0% Pure)</li>
              <li>• White Gold & Rose Gold</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-400 mb-2">⚪ Silver</h4>
            <ul className="text-sm space-y-1">
              <li>• 999 Pure Silver</li>
              <li>• 925 Sterling Silver</li>
              <li>• Oxidized Silver</li>
              <li>• Silver Plated</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-600 mb-2">
              ⚫ Platinum & Others
            </h4>
            <ul className="text-sm space-y-1">
              <li>• PT950 Platinum</li>
              <li>• PT900 Platinum</li>
              <li>• Palladium</li>
              <li>• Titanium</li>
              <li>• Stainless Steel</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Precious Stones */}
      <Card title="Precious Stones & Gems">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            "💎 Diamond",
            "❤️ Ruby",
            "💚 Emerald",
            "💙 Sapphire",
            "🤍 Pearl",
            "💛 Topaz",
            "🔴 Garnet",
            "💜 Amethyst",
            "💎 Aquamarine",
            "🌈 Opal",
            "🔵 Turquoise",
            "🧡 Coral",
          ].map((stone, index) => (
            <div key={index} className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="text-sm">{stone}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

"use client";

import React from "react";
import { EnhancedMetalRatesManager } from "@/components/EnhancedMetalRatesManager";
import { EnhancedProductManager } from "@/components/EnhancedProductManager";
import { EnhancedCustomerManager } from "@/components/EnhancedCustomerManager";

export const BillingPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-slide-up">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700 shadow-sm text-center">
        <div className="text-6xl mb-4">🧾</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Billing System
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Create and manage jewelry bills with automatic calculations
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
            <div className="text-2xl mb-2">⚖️</div>
            <h3 className="font-semibold text-green-800 dark:text-green-300">
              Weight Calculations
            </h3>
            <p className="text-sm text-green-600 dark:text-green-400">
              Precise jewelry weight calculations
            </p>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="text-2xl mb-2">💎</div>
            <h3 className="font-semibold text-blue-800 dark:text-blue-300">
              Stone Management
            </h3>
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Handle diamonds and gems
            </p>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-purple-800 dark:text-purple-300">
              GST Compliance
            </h3>
            <p className="text-sm text-purple-600 dark:text-purple-400">
              Automatic tax calculations
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProductsPage: React.FC = () => {
  return (
    <div className="animate-slide-up">
      <EnhancedProductManager />
    </div>
  );
};

export const CustomersPage: React.FC = () => {
  return (
    <div className="animate-slide-up">
      <EnhancedCustomerManager />
    </div>
  );
};

export const BillsPage: React.FC = () => {
  return (
    <div className="space-y-6 animate-slide-up">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700 shadow-sm text-center">
        <div className="text-6xl mb-4">📋</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Bills History
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          View and manage billing history and reports
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-700">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold text-orange-800 dark:text-orange-300">
              Sales Reports
            </h3>
            <p className="text-sm text-orange-600 dark:text-orange-400">
              Daily, monthly, yearly reports
            </p>
          </div>
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
            <div className="text-2xl mb-2">🔍</div>
            <h3 className="font-semibold text-red-800 dark:text-red-300">
              Search & Filter
            </h3>
            <p className="text-sm text-red-600 dark:text-red-400">
              Find specific transactions
            </p>
          </div>
          <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg border border-teal-200 dark:border-teal-700">
            <div className="text-2xl mb-2">🖨️</div>
            <h3 className="font-semibold text-teal-800 dark:text-teal-300">
              Print & Export
            </h3>
            <p className="text-sm text-teal-600 dark:text-teal-400">
              PDF and Excel exports
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const RatesPage: React.FC = () => {
  return (
    <div className="animate-slide-up">
      <EnhancedMetalRatesManager />
    </div>
  );
};

import React from "react";
import { EnhancedMetalRatesManager } from "@/components/EnhancedMetalRatesManager";
import { EnhancedProductManager } from "@/components/EnhancedProductManager";
import EnhancedCustomerManager from "@/components/EnhancedCustomerManager";
import { EnhancedBillingManager } from "@/components/EnhancedBillingManager";
import { EnhancedBillsHistory } from "@/components/EnhancedBillsHistory";
import ExpenseManager from "@/components/ExpenseManager";

export const BillingPage: React.FC = () => {
  return (
    <div className="animate-slide-up">
      <EnhancedBillingManager />
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
    <div className="animate-slide-up">
      <EnhancedBillsHistory />
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

// New: Expenses page (records expenses / purchases and computes simple P&L)
export const ExpensesPage: React.FC = () => {
  return (
    <div className="animate-slide-up">
      <ExpenseManager />
    </div>
  );
};

// New: Reports page (placeholder — add detailed reports / export UI as needed)
export const ReportsPage: React.FC = () => {
  return (
    <div className="animate-slide-up">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-zinc-600">
          Quick links: Profit & Loss, Monthly Summary, Inventory Valuation,
          Export CSV/PDF.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="p-4 border rounded">
            <h3 className="font-medium">Profit & Loss</h3>
            <p className="text-sm text-zinc-500 mt-2">
              View P&L for week/month/year.
            </p>
            <div className="mt-3">
              <button className="px-3 py-1 bg-blue-600 text-white rounded">
                Open
              </button>
            </div>
          </div>
          <div className="p-4 border rounded">
            <h3 className="font-medium">Inventory Valuation</h3>
            <p className="text-sm text-zinc-500 mt-2">
              Summary of stock value.
            </p>
            <div className="mt-3">
              <button className="px-3 py-1 bg-blue-600 text-white rounded">
                Open
              </button>
            </div>
          </div>
          <div className="p-4 border rounded">
            <h3 className="font-medium">Exports</h3>
            <p className="text-sm text-zinc-500 mt-2">
              Export reports as CSV or PDF.
            </p>
            <div className="mt-3">
              <button className="px-3 py-1 bg-blue-600 text-white rounded">
                Export
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

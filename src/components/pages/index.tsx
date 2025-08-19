"use client";

import React from "react";
import { EnhancedMetalRatesManager } from "@/components/EnhancedMetalRatesManager";
import { EnhancedProductManager } from "@/components/EnhancedProductManager";
import  EnhancedCustomerManager  from "@/components/EnhancedCustomerManager";
import { EnhancedBillingManager } from "@/components/EnhancedBillingManager";
import { EnhancedBillsHistory } from "@/components/EnhancedBillsHistory";

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

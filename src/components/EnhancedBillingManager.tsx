"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Input,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { useMetalRates } from "@/services/metalRatesService";
import ExcelActions from "@/components/ExcelActions";

interface BillItem {
  id: string;
  productId: string;
  productSerialNumber: string;
  productName: string;
  category: string;
  metal: "gold" | "silver" | "platinum";
  purity: string;
  weight: number;
  stoneWeight?: number;
  netWeight: number;
  rate: number;
  makingCharges: number;
  makingChargesType: "fixed" | "percentage";
  wastage: number;
  wastageType: "fixed" | "percentage";
  amount: number;
}

interface Bill {
  id: string;
  billNumber: string;
  date: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerGST?: string;
  items: BillItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paymentMode: "cash" | "card" | "upi" | "bank_transfer" | "cheque" | "partial";
  paymentStatus: "paid" | "pending" | "partial";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  id: string;
  serialNumber: string;
  slug: string;
  name: string;
  category: string;
  metal: "gold" | "silver" | "platinum";
  purity: string;
  weight: number;
  stoneWeight?: number;
  makingCharges: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  gstNumber?: string;
  totalPurchases?: number;
  lastPurchaseDate?: string;
}

export const EnhancedBillingManager: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currentBill, setCurrentBill] = useState<Partial<Bill>>({
    items: [],
    discount: 0,
    paymentMode: "cash",
    paymentStatus: "paid",
  });

  const { rates: liveRates } = useMetalRates();

  // Load data from localStorage
  useEffect(() => {
    const savedBills = localStorage.getItem("bills");
    const savedProducts = localStorage.getItem("products");
    const savedCustomers = localStorage.getItem("customers");

    if (savedBills) {
      try {
        setBills(JSON.parse(savedBills));
      } catch (error) {
        console.error("Failed to parse bills:", error);
      }
    }

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

  // Save bills to localStorage
  const saveBills = (newBills: Bill[]) => {
    setBills(newBills);
    localStorage.setItem("bills", JSON.stringify(newBills));
  };

  // Generate bill number
  const generateBillNumber = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    const billCount = bills.length + 1;
    return `SJ${year}${month}${day}${String(billCount).padStart(4, "0")}`;
  };

  // Calculate item amount
  const calculateItemAmount = (item: Partial<BillItem>): number => {
    if (!item.netWeight || !item.rate) return 0;

    const baseAmount = item.netWeight * item.rate;
    let makingAmount = 0;
    let wastageAmount = 0;

    if (item.makingCharges) {
      if (item.makingChargesType === "percentage") {
        makingAmount = (baseAmount * item.makingCharges) / 100;
      } else {
        makingAmount = item.makingCharges;
      }
    }

    if (item.wastage) {
      if (item.wastageType === "percentage") {
        wastageAmount = (baseAmount * item.wastage) / 100;
      } else {
        wastageAmount = item.wastage;
      }
    }

    return baseAmount + makingAmount + wastageAmount;
  };

  // Calculate bill totals
  const calculateBillTotals = (bill: Partial<Bill>) => {
    const subtotal =
      bill.items?.reduce((sum, item) => sum + item.amount, 0) || 0;
    const discountAmount = bill.discount || 0;
    const discountedAmount = subtotal - discountAmount;

    // GST calculations (3% CGST + 3% SGST for jewelry)
    const gstRate = 3; // 3% each for CGST and SGST
    const cgst = (discountedAmount * gstRate) / 100;
    const sgst = (discountedAmount * gstRate) / 100;
    const igst = 0; // IGST only for inter-state transactions

    const finalAmount = discountedAmount + cgst + sgst + igst;

    return {
      subtotal,
      cgst,
      sgst,
      igst,
      totalAmount: discountedAmount + cgst + sgst + igst,
      finalAmount,
    };
  };

  // Add item to current bill
  const addItemToBill = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    // Get live rate for the metal
    const liveRate = liveRates.find(
      (rate) => rate.metal === product.metal && rate.purity === product.purity
    );

    const netWeight = product.weight - (product.stoneWeight || 0);

    const newItem: BillItem = {
      id: Date.now().toString(),
      productId: product.id,
      productSerialNumber: product.serialNumber,
      productName: product.name,
      category: product.category,
      metal: product.metal,
      purity: product.purity,
      weight: product.weight,
      stoneWeight: product.stoneWeight,
      netWeight,
      rate: liveRate?.rate || 0,
      makingCharges: product.makingCharges,
      makingChargesType: "fixed",
      wastage: 0,
      wastageType: "percentage",
      amount: 0,
    };

    newItem.amount = calculateItemAmount(newItem);

    setCurrentBill((prev) => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }));
  };

  // Update item in current bill
  const updateItemInBill = (itemId: string, updates: Partial<BillItem>) => {
    setCurrentBill((prev) => ({
      ...prev,
      items:
        prev.items?.map((item) => {
          if (item.id === itemId) {
            const updatedItem = { ...item, ...updates };
            updatedItem.amount = calculateItemAmount(updatedItem);
            return updatedItem;
          }
          return item;
        }) || [],
    }));
  };

  // Remove item from current bill
  const removeItemFromBill = (itemId: string) => {
    setCurrentBill((prev) => ({
      ...prev,
      items: prev.items?.filter((item) => item.id !== itemId) || [],
    }));
  };

  // Create new bill
  const handleCreateBill = () => {
    if (!currentBill.customerId || !currentBill.items?.length) return;

    const customer = customers.find((c) => c.id === currentBill.customerId);
    if (!customer) return;

    const totals = calculateBillTotals(currentBill);

    const newBill: Bill = {
      id: Date.now().toString(),
      billNumber: generateBillNumber(),
      date: new Date().toISOString().split("T")[0],
      customerId: currentBill.customerId,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerGST: customer.gstNumber,
      items: currentBill.items || [],
      subtotal: totals.subtotal,
      cgst: totals.cgst,
      sgst: totals.sgst,
      igst: totals.igst,
      totalAmount: totals.totalAmount,
      discount: currentBill.discount || 0,
      finalAmount: totals.finalAmount,
      paymentMode: currentBill.paymentMode || "cash",
      paymentStatus: currentBill.paymentStatus || "paid",
      notes: currentBill.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveBills([...bills, newBill]);

    // Update customer's total purchases
    const updatedCustomers = customers.map((c) =>
      c.id === customer.id
        ? {
            ...c,
            totalPurchases: (c.totalPurchases || 0) + totals.finalAmount,
            lastPurchaseDate: new Date().toISOString(),
          }
        : c
    );
    localStorage.setItem("customers", JSON.stringify(updatedCustomers));
    setCustomers(updatedCustomers);

    resetForm();
  };

  // Edit bill
  const handleEditBill = (bill: Bill) => {
    setEditingBill(bill);
    setCurrentBill(bill);
    setShowAddForm(true);
  };

  // Update bill
  const handleUpdateBill = () => {
    if (!editingBill || !currentBill.customerId || !currentBill.items?.length)
      return;

    const customer = customers.find((c) => c.id === currentBill.customerId);
    if (!customer) return;

    const totals = calculateBillTotals(currentBill);

    const updatedBill: Bill = {
      ...editingBill,
      customerId: currentBill.customerId,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerGST: customer.gstNumber,
      items: currentBill.items || [],
      subtotal: totals.subtotal,
      cgst: totals.cgst,
      sgst: totals.sgst,
      igst: totals.igst,
      totalAmount: totals.totalAmount,
      discount: currentBill.discount || 0,
      finalAmount: totals.finalAmount,
      paymentMode: currentBill.paymentMode || "cash",
      paymentStatus: currentBill.paymentStatus || "paid",
      notes: currentBill.notes,
      updatedAt: new Date().toISOString(),
    };

    const updatedBills = bills.map((bill) =>
      bill.id === editingBill.id ? updatedBill : bill
    );

    saveBills(updatedBills);
    resetForm();
  };

  // Print bill
  const printBill = (bill: Bill) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const billHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Bill ${bill.billNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .bill-details { display: flex; justify-content: space-between; margin-bottom: 20px; }
          .customer-details { margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .totals { margin-left: auto; width: 300px; }
          .total-row { font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">Shubham Jewellers</div>
          <div>Complete Jewelry Solutions</div>
        </div>
        
        <div class="bill-details">
          <div>
            <strong>Bill No:</strong> ${bill.billNumber}<br>
            <strong>Date:</strong> ${new Date(bill.date).toLocaleDateString()}
          </div>
          <div>
            <strong>Payment Mode:</strong> ${bill.paymentMode.toUpperCase()}<br>
            <strong>Status:</strong> ${bill.paymentStatus.toUpperCase()}
          </div>
        </div>
        
        <div class="customer-details">
          <strong>Customer Details:</strong><br>
          Name: ${bill.customerName}<br>
          Phone: ${bill.customerPhone}<br>
          ${bill.customerGST ? `GST: ${bill.customerGST}<br>` : ""}
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Metal/Purity</th>
              <th>Weight (g)</th>
              <th>Rate (₹/g)</th>
              <th>Making (₹)</th>
              <th>Wastage (₹)</th>
              <th>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${bill.items
              .map(
                (item) => `
              <tr>
                <td>${item.productName}</td>
                <td>${item.metal} ${item.purity}</td>
                <td>${item.netWeight}</td>
                <td>${item.rate}</td>
                <td>${item.makingCharges}${
                  item.makingChargesType === "percentage" ? "%" : ""
                }</td>
                <td>${item.wastage}${
                  item.wastageType === "percentage" ? "%" : ""
                }</td>
                <td>${item.amount.toLocaleString()}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
        
        <div class="totals">
          <table>
            <tr><td>Subtotal:</td><td>₹${bill.subtotal.toLocaleString()}</td></tr>
            <tr><td>Discount:</td><td>-₹${bill.discount.toLocaleString()}</td></tr>
            <tr><td>CGST (3%):</td><td>₹${bill.cgst.toLocaleString()}</td></tr>
            <tr><td>SGST (3%):</td><td>₹${bill.sgst.toLocaleString()}</td></tr>
            <tr class="total-row"><td><strong>Total Amount:</strong></td><td><strong>₹${bill.finalAmount.toLocaleString()}</strong></td></tr>
          </table>
        </div>
        
        ${bill.notes ? `<div><strong>Notes:</strong> ${bill.notes}</div>` : ""}
        
        <div class="footer">
          Thank you for choosing Shubham Jewellers!<br>
          Generated on ${new Date().toLocaleString()}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(billHTML);
    printWindow.document.close();
    printWindow.print();
  };

  // Delete bill
  const handleDeleteBill = (id: string) => {
    if (confirm("Are you sure you want to delete this bill?")) {
      saveBills(bills.filter((bill) => bill.id !== id));
    }
  };

  // Reset form
  const resetForm = () => {
    setCurrentBill({
      items: [],
      discount: 0,
      paymentMode: "cash",
      paymentStatus: "paid",
    });
    setEditingBill(null);
    setShowAddForm(false);
  };

  // Filter bills
  const filteredBills = bills.filter((bill) => {
    const matchesSearch =
      bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.customerPhone.includes(searchTerm);
    const matchesStatus =
      filterStatus === "all" || bill.paymentStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const currentBillTotals = calculateBillTotals(currentBill);

  // Dialog open state is controlled by showAddForm or editingBill
  const isDialogOpen = showAddForm || editingBill;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Billing Management
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            Create and manage jewelry bills with GST compliance
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExcelActions
            type="bills"
            data={bills}
            onExport={() => console.log("Bills exported")}
          />
          <Button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2"
          >
            <span>🧾</span>
            Create New Bill
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Search bills by number, customer name, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Create/Edit Bill Form Dialog */}
      <Dialog
        open={!!isDialogOpen}
        onOpenChange={(open: boolean) => {
          if (!open) resetForm();
        }}
      >
        <DialogContent fullScreen={true} className="overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBill ? "Edit Bill" : "Create New Bill"}
            </DialogTitle>
          </DialogHeader>

          {/* Customer Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Select Customer *
              </label>
              <select
                value={currentBill.customerId || ""}
                onChange={(e) =>
                  setCurrentBill((prev) => ({
                    ...prev,
                    customerId: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Add Product to Bill
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addItemToBill(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
              >
                <option value="">Select a product to add</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    #{product.serialNumber} - {product.name} - {product.metal}{" "}
                    {product.purity} - {product.weight}g
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Bill Items */}
          {currentBill.items && currentBill.items.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-semibold text-zinc-900 dark:text-white mb-3">
                Bill Items
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-zinc-200 dark:border-zinc-700">
                  <thead className="bg-zinc-50 dark:bg-zinc-700">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-300 uppercase">
                        Product
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-300 uppercase">
                        Weight
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-300 uppercase">
                        Rate
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-300 uppercase">
                        Making
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-300 uppercase">
                        Wastage
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-300 uppercase">
                        Amount
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-300 uppercase">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-700">
                    {currentBill.items.map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 text-sm text-zinc-900 dark:text-white">
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            <p className="text-blue-600 dark:text-blue-400 font-mono text-xs">
                              #{item.productSerialNumber}
                            </p>
                            <p className="text-zinc-500">
                              {item.metal} {item.purity}
                            </p>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm text-zinc-900 dark:text-white">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.netWeight}
                            onChange={(e) =>
                              updateItemInBill(item.id, {
                                netWeight: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-20"
                          />
                          <span className="text-xs text-zinc-500">g</span>
                        </td>
                        <td className="px-3 py-2 text-sm text-zinc-900 dark:text-white">
                          <Input
                            type="number"
                            value={item.rate}
                            onChange={(e) =>
                              updateItemInBill(item.id, {
                                rate: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="w-24"
                          />
                        </td>
                        <td className="px-3 py-2 text-sm text-zinc-900 dark:text-white">
                          <div className="flex flex-col gap-1">
                            <Input
                              type="number"
                              value={item.makingCharges}
                              onChange={(e) =>
                                updateItemInBill(item.id, {
                                  makingCharges:
                                    parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-20"
                            />
                            <select
                              value={item.makingChargesType}
                              onChange={(e) =>
                                updateItemInBill(item.id, {
                                  makingChargesType: e.target.value as
                                    | "fixed"
                                    | "percentage",
                                })
                              }
                              className="w-20 text-xs px-1 py-1 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                            >
                              <option value="fixed">₹</option>
                              <option value="percentage">%</option>
                            </select>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm text-zinc-900 dark:text-white">
                          <div className="flex flex-col gap-1">
                            <Input
                              type="number"
                              value={item.wastage}
                              onChange={(e) =>
                                updateItemInBill(item.id, {
                                  wastage: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-20"
                            />
                            <select
                              value={item.wastageType}
                              onChange={(e) =>
                                updateItemInBill(item.id, {
                                  wastageType: e.target.value as
                                    | "fixed"
                                    | "percentage",
                                })
                              }
                              className="w-20 text-xs px-1 py-1 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                            >
                              <option value="fixed">₹</option>
                              <option value="percentage">%</option>
                            </select>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm font-medium text-zinc-900 dark:text-white">
                          ₹{item.amount.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-sm">
                          <button
                            onClick={() => removeItemFromBill(item.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bill Totals and Payment Details */}
          {currentBill.items && currentBill.items.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Payment Details */}
              <div>
                <h4 className="text-md font-semibold text-zinc-900 dark:text-white mb-3">
                  Payment Details
                </h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Discount (₹)
                    </label>
                    <Input
                      type="number"
                      value={currentBill.discount || 0}
                      onChange={(e) =>
                        setCurrentBill((prev) => ({
                          ...prev,
                          discount: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={currentBill.paymentMode}
                      onChange={(e) =>
                        setCurrentBill((prev) => ({
                          ...prev,
                          paymentMode: e.target.value as any,
                        }))
                      }
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="cheque">Cheque</option>
                      <option value="partial">Partial Payment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Payment Status
                    </label>
                    <select
                      value={currentBill.paymentStatus}
                      onChange={(e) =>
                        setCurrentBill((prev) => ({
                          ...prev,
                          paymentStatus: e.target.value as any,
                        }))
                      }
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    >
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="partial">Partial</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={currentBill.notes || ""}
                      onChange={(e) =>
                        setCurrentBill((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="Additional notes..."
                      rows={3}
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Bill Summary */}
              <div>
                <h4 className="text-md font-semibold text-zinc-900 dark:text-white mb-3">
                  Bill Summary
                </h4>
                <div className="bg-zinc-50 dark:bg-zinc-700 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Subtotal:
                    </span>
                    <span className="font-medium">
                      ₹{currentBillTotals.subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      Discount:
                    </span>
                    <span className="font-medium text-red-600">
                      -₹{(currentBill.discount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      CGST (3%):
                    </span>
                    <span className="font-medium">
                      ₹{currentBillTotals.cgst.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-600 dark:text-zinc-400">
                      SGST (3%):
                    </span>
                    <span className="font-medium">
                      ₹{currentBillTotals.sgst.toLocaleString()}
                    </span>
                  </div>
                  <div className="border-t border-zinc-300 dark:border-zinc-600 pt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Amount:</span>
                      <span className="text-green-600 dark:text-green-400">
                        ₹{currentBillTotals.finalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex gap-2 mt-4">
            <Button
              onClick={editingBill ? handleUpdateBill : handleCreateBill}
              disabled={!currentBill.customerId || !currentBill.items?.length}
              className="flex-1 max-h-[40px] flex items-center justify-center"
            >
              {editingBill ? "Update Bill" : "Create Bill"}
            </Button>
            <Button onClick={resetForm} variant="secondary"
              className="flex-1 max-h-[40px] flex items-center justify-center">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bills List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredBills.map((bill) => (
          <Card key={bill.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    Bill #{bill.billNumber}
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      bill.paymentStatus === "paid"
                        ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300"
                        : bill.paymentStatus === "pending"
                        ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300"
                        : "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300"
                    }`}
                  >
                    {bill.paymentStatus.charAt(0).toUpperCase() +
                      bill.paymentStatus.slice(1)}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400">Customer</p>
                    <p className="font-medium">{bill.customerName}</p>
                    <p className="text-zinc-600 dark:text-zinc-400">
                      {bill.customerPhone}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400">Date</p>
                    <p className="font-medium">
                      {new Date(bill.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400">Items</p>
                    <p className="font-medium">{bill.items.length} item(s)</p>
                  </div>
                  <div>
                    <p className="text-zinc-500 dark:text-zinc-400">Amount</p>
                    <p className="font-bold text-green-600 dark:text-green-400">
                      ₹{bill.finalAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
                {bill.notes && (
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 italic">
                    {bill.notes}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditBill(bill)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-2"
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDeleteBill(bill.id)}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-2"
                  title="Delete"
                >
                  🗑️
                </button>
                <button
                  onClick={() => printBill(bill)}
                  className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 p-2"
                  title="Print"
                >
                  🖨️
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredBills.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-4xl mb-4">🧾</div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
            No bills found
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            {bills.length === 0
              ? "Start by creating your first bill."
              : "Try adjusting your search criteria."}
          </p>
          {bills.length === 0 && (
            <Button onClick={() => setShowAddForm(true)}>
              Create Your First Bill
            </Button>
          )}
        </Card>
      )}

      {/* Summary */}
      {bills.length > 0 && (
        <Card className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div>
              <p className="font-semibold text-zinc-900 dark:text-white">
                {bills.length}
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">Total Bills</p>
            </div>
            <div>
              <p className="font-semibold text-zinc-900 dark:text-white">
                {filteredBills.length}
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">Showing</p>
            </div>
            <div>
              <p className="font-semibold text-green-600 dark:text-green-400">
                ₹
                {bills
                  .reduce((sum, bill) => sum + bill.finalAmount, 0)
                  .toLocaleString()}
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">Total Revenue</p>
            </div>
            <div>
              <p className="font-semibold text-red-600 dark:text-red-400">
                {
                  bills.filter((bill) => bill.paymentStatus === "pending")
                    .length
                }
              </p>
              <p className="text-zinc-600 dark:text-zinc-400">
                Pending Payments
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

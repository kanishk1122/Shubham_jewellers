"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
 
} from "@/components/ui";
import { useMetalRates } from "@/services/metalRatesService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  fetchBills,
  fetchBillById,
  createBill as createBillThunk,
  updateBill as updateBillThunk,
  deleteBill as deleteBillThunk,
} from "@/store/slices/billsSlice";
import { useProducts } from "@/hooks/useProducts";
import { useBulkProducts } from "@/hooks/useBulkProducts";
import { useCustomers } from "@/hooks/useCustomers";
import ExcelActions from "@/components/ExcelActions";
import {
  Receipt,
  PlusCircle,
  Edit,
  Trash2,
  Printer,
  RefreshCw,
  Package,
  Warehouse,
} from "lucide-react";
import type { Bill, BillItem } from "@/types/bill";
import axios from "axios";
import { apiFetch } from "@/lib/fetcher";
import { Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
}
from "@/components/ui/select";

interface Product {
  _id?: string;
  id?: string;
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
  _id?: string;
  id?: string;
  name: string;
  phone: string;
  gstNumber?: string;
  totalPurchases?: number;
  lastPurchaseDate?: string;
}

export const EnhancedBillingManager: React.FC = () => {
  // Redux hooks for bills
  const dispatch = useAppDispatch();
  const billsState = useAppSelector((state) => state.bills);
  const { bills, loading: billsLoading } = billsState;
  const { products: productsData, loading: productsLoading } = useProducts();
  const {
    bulkProducts: bulkProductsData,
    loading: bulkLoading,
    updateBulkProduct,
    loadBulkProducts,
  } = useBulkProducts();
  const {
    customers: customersData,
    loading: customersLoading,
    loadCustomers,
    searchCustomers,
  } = useCustomers();

  // Ensure arrays are always defined
  const products = Array.isArray(productsData) ? productsData : [];
  const bulkProducts = Array.isArray(bulkProductsData) ? bulkProductsData : [];
  const customers = Array.isArray(customersData) ? customersData : [];

  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [savingBill, setSavingBill] = useState(false);
  const [currentBill, setCurrentBill] = useState<Partial<Bill>>({
    items: [],
    discount: 0,
    paymentMode: "cash",
    paymentStatus: "paid",
    taxType: "cgst", // "cgst" (CGST+SGST) or "igst"
  });
  const [showBulkProductDialog, setShowBulkProductDialog] = useState(false);
  const [selectedBulkProduct, setSelectedBulkProduct] = useState<any>(null);
  const [bulkProductForm, setBulkProductForm] = useState({
    productName: "",
    grossWeight: 0,
    packageWeight: 0,
    netWeight: 0,
    makingCharges: 0,
    makingChargesType: "fixed" as "fixed" | "percentage",
    wastage: 0,
    wastageType: "percentage" as "fixed" | "percentage",
  });

  const { rates: liveRates } = useMetalRates();
  const loading =
    billsLoading || productsLoading || bulkLoading || customersLoading;

  useEffect(() => {
    // Load initial data
    const loadData = async () => {
      await dispatch(fetchBills());
      await loadBulkProducts();
      await loadCustomers();
    };
    loadData();
  }, [dispatch, loadBulkProducts, loadCustomers]);

  // Calculate item amount with proper rate conversion
  const calculateItemAmount = (item: Partial<BillItem>): number => {
    if (!item.netWeight || !item.rate) return 0;

    // Convert rate to per-gram basis based on metal type
    let ratePerGram = item.rate;

    if (item.metal === "silver") {
      // Silver rates are typically per kg (1000g), convert to per gram
      ratePerGram = item.rate / 1000;
    } else if (item.metal === "gold") {
      // Gold rates are typically per 10g, convert to per gram
      ratePerGram = item.rate / 10;
    } else if (item.metal === "platinum") {
      // Platinum rates are typically per gram already
      ratePerGram = item.rate;
    }

    const baseAmount = item.netWeight * ratePerGram;
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

  // Calculate bill totals (supports CGST+SGST or IGST)
  const calculateBillTotals = (bill: Partial<Bill>) => {
    const subtotal =
      bill.items?.reduce((sum, item) => sum + (item.amount || 0), 0) || 0;
    const discountAmount = bill.discount || 0;
    const discountedAmount = subtotal - discountAmount;

    // Base GST % per part (3% CGST and 3% SGST) — IGST equals combined rate
    const partRate = 3; // percent (CGST or SGST)
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (bill.taxType === "igst") {
      // IGST is sum of CGST+SGST => 6% in this setup
      igst = (discountedAmount * partRate * 2) / 100;
    } else if (bill.taxType === "cgst") {
      cgst = (discountedAmount * partRate) / 100;
      sgst = (discountedAmount * partRate) / 100;
    } else {
      igst = 0;
      cgst = 0;
      sgst = 0;
    }

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

  // Add item to current bill with proper rate handling
  const addItemToBill = (productId: string) => {
    const product = products.find((p) => (p._id || p.id) === productId);
    if (!product) return;

    // Get live rate for the metal
    const liveRate = liveRates.find(
      (rate) => rate.metal === product.metal && rate.purity === product.purity
    );

    const netWeight = product.weight - (product.stoneWeight || 0);

    const newItem: BillItem = {
      id: Date.now().toString(),
      productId: product._id || product.id || "",
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

  // Edit bill
  const handleEditBill = (bill: Bill) => {
    setEditingBill(bill);
    setCurrentBill(bill);
    setShowAddForm(true);
  };

  console.log("Current Bill:", editingBill);

  // Add item from bulk inventory
  const addBulkItemToBill = () => {
    if (!selectedBulkProduct || !bulkProductForm.productName) return;

    // Get live rate for the metal
    const liveRate = liveRates.find(
      (rate) =>
        rate.metal === selectedBulkProduct.metal &&
        rate.purity === selectedBulkProduct.purity
    );

    const newItem: BillItem = {
      id: Date.now().toString(),
      // FIX: Use only the ObjectId string for productId
      productId: selectedBulkProduct._id || selectedBulkProduct.id || "",
      productSerialNumber: `BULK-${Date.now()}`,
      productName: bulkProductForm.productName,
      category: selectedBulkProduct.category,
      metal: selectedBulkProduct.metal,
      purity: selectedBulkProduct.purity,
      weight: bulkProductForm.grossWeight,
      stoneWeight: 0,
      netWeight: bulkProductForm.netWeight,
      packageWeight: bulkProductForm.packageWeight,
      rate: liveRate?.rate || 0,
      makingCharges: bulkProductForm.makingCharges,
      makingChargesType: bulkProductForm.makingChargesType,
      wastage: bulkProductForm.wastage,
      wastageType: bulkProductForm.wastageType,
      amount: 0,
      bulkProductId: selectedBulkProduct._id || selectedBulkProduct.id,
      isFromBulk: true,
    };

    newItem.amount = calculateItemAmount(newItem);

    setCurrentBill((prev) => ({
      ...prev,
      items: [...(prev.items || []), newItem],
    }));

    // Reset form and close dialog
    setBulkProductForm({
      productName: "",
      grossWeight: 0,
      packageWeight: 0,
      netWeight: 0,
      makingCharges: 0,
      makingChargesType: "fixed",
      wastage: 0,
      wastageType: "percentage",
    });
    setSelectedBulkProduct(null);
    setShowBulkProductDialog(false);
  };

  // Deduct weight from bulk inventory when bill is created
  const deductWeightFromBulk = async (items: BillItem[]) => {
    for (const item of items) {
      if (item.isFromBulk && item.bulkProductId) {
        try {
          // Find the actual bulk product to get current remaining weight
          const bulkProduct = bulkProducts.find(
            (bp) => (bp._id || bp.id) === item.bulkProductId
          );

          if (!bulkProduct) {
            console.error("Bulk product not found:", item.bulkProductId);
            continue;
          }

          const totalDeduction = (item.weight || 0) + (item.packageWeight || 0);
          const newRemainingWeight =
            bulkProduct.remainingWeight - totalDeduction;

          // Use the PATCH endpoint to deduct weight
          const response = await axios.patch(
            `/api/bulk-products/${item.bulkProductId}`,
            {
              deductWeight: totalDeduction,
            }
          );

          const result = await response.data;

          if (!result.success) {
            console.error("Failed to deduct weight:", result.error);
            alert(
              `Failed to deduct weight from ${item.productName}: ${result.error}`
            );
          } else {
            console.log(
              `Successfully deducted ${totalDeduction}g from ${item.productName}`
            );
          }
        } catch (error) {
          console.error("Failed to deduct weight from bulk product:", error);
          alert(`Error deducting weight from ${item.productName}: ${error}`);
        }
      }
    }
  };

  // Helper to fetch customer from backend by ID
  const fetchCustomerById = async (
    customerId: string
  ): Promise<Customer | null> => {
    try {
      const res = await axios.get(`/api/customers/${customerId}`);
      return res.data?.data || null;
    } catch {
      return null;
    }
  };

  // Modified create bill function
  const handleCreateBill = async () => {
    if (!currentBill.customerId || !currentBill.items?.length) return;

    setSavingBill(true);

    try {
      // Fetch customer from backend
      const customer = await fetchCustomerById(
        currentBill.customerId as string
      );
      if (!customer) {
        alert("Customer not found. Please select a valid customer.");
        setSavingBill(false);
        return;
      }

      const totals = calculateBillTotals(currentBill);

      const newBillData = {
        customerId: currentBill.customerId,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerGST: customer.gstNumber || undefined, // GST remains optional
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
        date: new Date().toISOString().split("T")[0],
        taxType: currentBill.taxType || "cgst",
      };

      // Use Redux thunk
      const resultAction = await dispatch(createBillThunk(newBillData));
      const result = (resultAction as any).payload;

      if (result && !result.error) {
        // Deduct weight from bulk inventory AFTER bill creation
        await deductWeightFromBulk(currentBill.items || []);

        // Reload bulk products to reflect the changes
        await loadBulkProducts();

        resetForm();
        await loadCustomers();

        alert("Bill created successfully and inventory updated!");
      } else {
        alert(
          (result && result.error) || "Failed to create bill. Please try again."
        );
      }
    } catch (error) {
      console.error("Failed to create bill:", error);
      alert("Failed to create bill. Please try again.");
    } finally {
      setSavingBill(false);
    }
  };

  // Update bill include taxType and igst values
  const handleUpdateBill = async () => {
    if (!editingBill || !currentBill.customerId || !currentBill.items?.length)
      return;

    setSavingBill(true);
    try {
      const customer = await fetchCustomerById(
        currentBill.customerId as string
      );
      if (!customer) {
        alert("Customer not found. Please select a valid customer.");
        setSavingBill(false);
        return;
      }

      const totals = calculateBillTotals(currentBill);

      const updateData = {
        customerId: currentBill.customerId,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerGST: customer.gstNumber || undefined,
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
        taxType: currentBill.taxType || "cgst",
      };

      const billId = editingBill._id || editingBill.id!;
      const resultAction = await dispatch(
        updateBillThunk({ id: billId, billData: updateData })
      );
      const result = (resultAction as any).payload;

      if (result && !result.error) {
        resetForm();
      } else {
        alert(
          (result && result.error) || "Failed to update bill. Please try again."
        );
      }
    } catch (error) {
      console.error("Failed to update bill:", error);
      alert("Failed to update bill. Please try again.");
    } finally {
      setSavingBill(false);
    }
  };

  // Delete bill using Redux thunk
  const handleDeleteBill = async (bill: Bill) => {
    if (!confirm("Are you sure you want to delete this bill?")) return;

    const billId = bill._id || bill.id!;
    const resultAction = await dispatch(deleteBillThunk(billId));
    const result = (resultAction as any).payload;

    if (result && !result.error) {
      // success
    } else {
      alert(
        (result && result.error) || "Failed to delete bill. Please try again."
      );
    }
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
            ${
              bill.igst && bill.igst > 0
                ? `<tr><td>IGST (6%):</td><td>₹${bill.igst.toLocaleString()}</td></tr>`
                : ""
            }
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
      (bill.billNumber &&
        bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bill.customerName &&
        bill.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (bill.customerPhone && bill.customerPhone.includes(searchTerm));
    const matchesStatus =
      filterStatus === "all" || bill.paymentStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const currentBillTotals = calculateBillTotals(currentBill);
  const isDialogOpen = showAddForm || editingBill;

  // Auto-calculate net weight when gross weight or package weight changes
  React.useEffect(() => {
    const netWeight =
      bulkProductForm.grossWeight - bulkProductForm.packageWeight;
    setBulkProductForm((prev) => ({
      ...prev,
      netWeight: Math.max(0, netWeight),
    }));
  }, [bulkProductForm.grossWeight, bulkProductForm.packageWeight]);

  // Customer search and dropdown logic (backend)
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [customerSearchResults, setCustomerSearchResults] = useState<
    Customer[]
  >([]);
  const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Quick add customer states
  const [showQuickAddCustomerDialog, setShowQuickAddCustomerDialog] =
    useState(false);
  const [quickCustomerForm, setQuickCustomerForm] = useState({
    name: "",
    phone: "",
    gstNumber: "",
  });
  const [creatingQuickCustomer, setCreatingQuickCustomer] = useState(false);

  // Custom product states (single custom item inputs)
  const [customProductName, setCustomProductName] = useState<string>("");
  const [customProductWeight, setCustomProductWeight] = useState<string>("");
  const [customProductRate, setCustomProductRate] = useState<string>("");
  const [customProductMaking, setCustomProductMaking] = useState<string>("");
  // New: custom product making mode and metal
  const [customMakingMode, setCustomMakingMode] = useState<"perGram" | "fixed">(
    "perGram"
  );
  const [customProductMetal, setCustomProductMetal] = useState<
    "gold" | "silver" | "platinum"
  >("gold");

  // per-gram making rates (adjust values as needed)
  const PER_GRAM_MAKING_RATE: Record<string, number> = {
    gold: 600,
    silver: 60,
    platinum: 800,
  };
  // preview item computed from inputs
  const previewCustomItem: Partial<BillItem> = {
    id: `PREVIEW-${Date.now()}`,
    productId: `CUSTOM-PREVIEW`,
    productSerialNumber: `CUSTOM-PREVIEW`,
    productName: customProductName || "",
    category: "Custom",
    metal: customProductMetal, // metal chosen by user
    purity: "24K", // default purity to satisfy backend validation
    weight: parseFloat(customProductWeight) || 0,
    stoneWeight: 0,
    netWeight: parseFloat(customProductWeight) || 0,
    rate: parseFloat(customProductRate) || 0,
    makingCharges:
      customMakingMode === "perGram"
        ? (parseFloat(customProductWeight) || 0) *
          (PER_GRAM_MAKING_RATE[customProductMetal] || 0)
        : parseFloat(customProductMaking) || 0,
    makingChargesType: "fixed",
    wastage: 0,
    wastageType: "percentage",
    amount: 0,
  };

  const addCustomProduct = () => {
    // require minimal fields
    if (
      !customProductName.trim() ||
      !customProductWeight.trim() ||
      !customProductRate.trim()
    )
      return;

    const idSuffix = Date.now().toString();
    const newItem: BillItem = {
      id: `CUSTOM-${idSuffix}`,
      productId: `CUSTOM-${idSuffix}`, // ensure productId is a unique, non-empty string
      productSerialNumber: `CUSTOM-${idSuffix}`,
      productName: customProductName.trim(),
      category: "Custom",
      metal: customProductMetal,
      purity: "24K", // default purity to satisfy backend validation
      weight: parseFloat(customProductWeight) || 0,
      stoneWeight: 0,
      netWeight: parseFloat(customProductWeight) || 0,
      rate: parseFloat(customProductRate) || 0,
      // compute makingCharges according to mode
      makingCharges:
        customMakingMode === "perGram"
          ? (parseFloat(customProductWeight) || 0) *
            (PER_GRAM_MAKING_RATE[customProductMetal] || 0)
          : parseFloat(customProductMaking) || 0,
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

    // reset inputs
    setCustomProductName("");
    setCustomProductWeight("");
    setCustomProductRate("");
    setCustomProductMaking("");
    // reset metal and making mode to defaults if desired
    setCustomMakingMode("perGram");
    setCustomProductMetal("gold");
  };

  // Backend search handler for customer selection
  const handleCustomerSearch = (term: string) => {
    setCustomerSearch(term);
    setCustomerDropdownOpen(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!term.trim()) {
      setCustomerSearchResults(customers);
      setCustomerDropdownOpen(false);
      return;
    }

    setCustomerSearchLoading(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const result = await searchCustomers(term, 1, 20); // limit to 20 results
        setCustomerSearchResults(result.data || []);
      } catch (err) {
        setCustomerSearchResults([]);
      } finally {
        setCustomerSearchLoading(false);
      }
    }, 400);
  };

  // Quick-create customer (used from dropdown)
  const createQuickCustomer = async () => {
    if (!quickCustomerForm.name && !quickCustomerForm.phone) {
      alert("Please enter name or phone");
      return;
    }
    if (quickCustomerForm.phone.length < 10) {
      alert("Please enter a valid phone number");
      return;
    }

    setCreatingQuickCustomer(true);
    try {
      const res = await apiFetch("/api/customers", {
        method: "POST",
        body: JSON.stringify(quickCustomerForm),
      });
      const data = await res.json();

      if (!res.ok || !data?.data) {
        alert(data?.error || "Failed to create customer");
        return;
      }

      const newCustomer = data.data;
      // reload customers and select new one
      await loadCustomers();
      setCurrentBill((prev) => ({
        ...prev,
        customerId: newCustomer._id || newCustomer.id,
      }));
      setCustomerSearch(`${newCustomer.name} - ${newCustomer.phone}`);
      setShowQuickAddCustomerDialog(false);
    } catch (err) {
      console.error("Failed to create customer:", err);
      alert("Failed to create customer. Please try again.");
    } finally {
      setCreatingQuickCustomer(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-6 h-6" />
            Billing Management
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            Create and manage jewelry bills with GST compliance
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              dispatch(fetchBills());
              loadCustomers();
            }}
            disabled={loading}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <ExcelActions
            type="bills"
            data={bills}
            onExport={() => console.log("Bills exported")}
          />
          <Button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Create New Bill
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Loading bills, products, and customers from database...
          </p>
        </Card>
      )}

      {/* Search and Filters */}
      {!loading && (
        <Card className="p-4 shadow-md rounded-2xl">
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Input */}
              <div className="md:col-span-2">
                <Input
                  placeholder="Search bills by number, customer name, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Status Filter */}
              <div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-700">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Product Selection Dialog */}
      <Dialog
        open={showBulkProductDialog}
        onOpenChange={setShowBulkProductDialog}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Product from Bulk Inventory</DialogTitle>
          </DialogHeader>

          {!selectedBulkProduct ? (
            <div>
              <h4 className="text-md font-semibold mb-3">
                Select Bulk Product
              </h4>
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {bulkProducts
                  .filter((bp) => bp.remainingWeight > 0)
                  .map((bulkProduct) => (
                    <Card
                      key={bulkProduct._id || bulkProduct.id}
                      className="p-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700"
                    >
                      <div
                        className="flex justify-between items-start"
                        onClick={() => {
                          setSelectedBulkProduct(bulkProduct);
                          setBulkProductForm({
                            productName: bulkProduct.name, // default to bulk name
                            grossWeight: 0,
                            packageWeight: 0,
                            netWeight: 0,
                            makingCharges: bulkProduct.makingCharges,
                            makingChargesType: "fixed",
                            wastage: 0,
                            wastageType: "percentage",
                          });
                        }}
                        role="button"
                        tabIndex={0}
                        style={{ cursor: "pointer" }}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            setSelectedBulkProduct(bulkProduct);
                            setBulkProductForm({
                              productName: bulkProduct.name,
                              grossWeight: 0,
                              packageWeight: 0,
                              netWeight: 0,
                              makingCharges: bulkProduct.makingCharges,
                              makingChargesType: "fixed",
                              wastage: 0,
                              wastageType: "percentage",
                            });
                          }
                        }}
                      >
                        <div>
                          <h5 className="font-medium">{bulkProduct.name}</h5>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            {bulkProduct.metal} {bulkProduct.purity}
                          </p>
                          <p className="text-sm text-green-600 dark:text-green-400">
                            Available: {bulkProduct.remainingWeight}g
                          </p>
                        </div>
                        <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-2 py-1 rounded font-mono">
                          {bulkProduct.slug}
                        </span>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="bg-zinc-50 dark:bg-zinc-700 p-4 rounded-lg mb-4">
                <h4 className="font-medium">{selectedBulkProduct.name}</h4>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {selectedBulkProduct.metal} {selectedBulkProduct.purity} •
                  Available: {selectedBulkProduct.remainingWeight}g
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Product Name *
                  </label>
                  <Input
                    value={selectedBulkProduct.category}
                    onChange={(e) =>
                      setBulkProductForm((prev) => ({
                        ...prev,
                        productName: e.target.value,
                      }))
                    }
                    placeholder="e.g., Gold Ring, Gold Chain"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Gross Weight (g) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={bulkProductForm.grossWeight}
                    onChange={(e) =>
                      setBulkProductForm((prev) => ({
                        ...prev,
                        grossWeight: parseFloat(e.target.value) || 0,
                      }))
                    }
                    max={selectedBulkProduct.remainingWeight}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Package Weight (g)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={bulkProductForm.packageWeight}
                    onChange={(e) =>
                      setBulkProductForm((prev) => ({
                        ...prev,
                        packageWeight: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Net Weight (g)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={bulkProductForm.netWeight}
                    readOnly
                    className="bg-zinc-100 dark:bg-zinc-600"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Auto-calculated: Gross Weight - Package Weight
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Making Charges
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={bulkProductForm.makingCharges}
                      onChange={(e) =>
                        setBulkProductForm((prev) => ({
                          ...prev,
                          makingCharges: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="flex-1"
                    />
                    <select
                      value={bulkProductForm.makingChargesType}
                      onChange={(e) =>
                        setBulkProductForm((prev) => ({
                          ...prev,
                          makingChargesType: e.target.value as
                            | "fixed"
                            | "percentage",
                        }))
                      }
                      className="w-16 px-2 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800"
                    >
                      <option value="fixed">₹</option>
                      <option value="percentage">%</option>
                    </select>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Default from inventory: ₹{selectedBulkProduct.makingCharges}
                  </p>
                </div>

                {/* <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Category
                  </label>
                  <Input
                    value={selectedBulkProduct.category}
                    readOnly
                    className="bg-zinc-100 dark:bg-zinc-600"
                  />
                  <p className="text-xs text-zinc-500 mt-1">
                    Default from inventory
                  </p>
                </div> */}

                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Wastage
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={bulkProductForm.wastage}
                      onChange={(e) =>
                        setBulkProductForm((prev) => ({
                          ...prev,
                          wastage: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="flex-1"
                    />
                    <select
                      value={bulkProductForm.wastageType}
                      onChange={(e) =>
                        setBulkProductForm((prev) => ({
                          ...prev,
                          wastageType: e.target.value as "fixed" | "percentage",
                        }))
                      }
                      className="w-16 px-2 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800"
                    >
                      <option value="fixed">₹</option>
                      <option value="percentage">%</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button
                  onClick={addBulkItemToBill}
                  disabled={
                    !bulkProductForm.productName || !bulkProductForm.grossWeight
                  }
                  className="flex-1"
                >
                  Add to Bill
                </Button>
                <Button
                  onClick={() => {
                    setSelectedBulkProduct(null);
                    setBulkProductForm({
                      productName: "",
                      grossWeight: 0,
                      packageWeight: 0,
                      netWeight: 0,
                      makingCharges: 0,
                      makingChargesType: "fixed",
                      wastage: 0,
                      wastageType: "percentage",
                    });
                  }}
                  variant="secondary"
                  className="flex-1"
                >
                  Back
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

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

          {/* Customer Selection and Product Addition */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Section */}
            <Card>
              <CardHeader>
                <CardTitle>Select Customer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Input
                    placeholder="Search customer by name, phone, or GST..."
                    value={customerSearch}
                    onChange={(e) => handleCustomerSearch(e.target.value)}
                    onFocus={() => setCustomerDropdownOpen(true)}
                    disabled={savingBill}
                  />
                  {customerDropdownOpen && (
                    <div className="absolute z-20 mt-1 w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {customerSearchLoading ? (
                        <div className="p-2 text-sm text-zinc-500">
                          Searching...
                        </div>
                      ) : customerSearchResults.length === 0 ? (
                        <div className="p-2 text-sm text-zinc-500">
                          No customers found
                          {customerSearch.trim().length > 0 && (
                            <Button
                              onClick={() => {
                                const term = customerSearch.trim();
                                const isPhone = /^\+?\d{7,}$/.test(term);
                                setQuickCustomerForm({
                                  name: isPhone ? "" : term,
                                  phone: isPhone ? term : "",
                                  gstNumber: "",
                                });
                                setShowQuickAddCustomerDialog(true);
                                setCustomerDropdownOpen(false);
                              }}
                              variant="secondary"
                              className="w-full justify-start mt-2 text-blue-600 hover:text-blue-700"
                            >
                              <PlusCircle className="w-4 h-4 mr-2" />
                              Add new customer:{" "}
                              <strong>{customerSearch}</strong>
                            </Button>
                          )}
                        </div>
                      ) : (
                        <>
                          {customerSearchResults.map((customer) => (
                            <div
                              key={customer._id || customer.id}
                              className={`px-3 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-zinc-800 rounded ${
                                currentBill.customerId ===
                                (customer._id || customer.id)
                                  ? "bg-blue-100 dark:bg-blue-900"
                                  : ""
                              }`}
                              onClick={() => {
                                setCurrentBill((prev) => ({
                                  ...prev,
                                  customerId: customer._id || customer.id,
                                }));
                                setCustomerSearch(
                                  `${customer.name} - ${customer.phone}`
                                );
                                setCustomerDropdownOpen(false);
                              }}
                            >
                              <span className="font-medium">
                                {customer.name}
                              </span>
                              <span className="ml-2 text-xs text-zinc-500">
                                {customer.phone}
                              </span>
                              {customer.gstNumber && (
                                <span className="ml-2 text-xs text-green-600">
                                  GST: {customer.gstNumber}
                                </span>
                              )}
                            </div>
                          ))}
                          {customerSearch.trim().length > 0 && (
                            <Button
                              onClick={() => {
                                const term = customerSearch.trim();
                                const isPhone = /^\+?\d{7,}$/.test(term);
                                setQuickCustomerForm({
                                  name: isPhone ? "" : term,
                                  phone: isPhone ? term : "",
                                  gstNumber: "",
                                });
                                setShowQuickAddCustomerDialog(true);
                                setCustomerDropdownOpen(false);
                              }}
                              variant="secondary"
                              className="w-full justify-start mt-2 text-blue-600 hover:text-blue-700"
                            >
                              <PlusCircle className="w-4 h-4 mr-2" />
                              Add new customer:{" "}
                              <strong>{customerSearch}</strong>
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected customer details */}
                {currentBill.customerId && (
                  <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {(() => {
                      const selected =
                        customerSearchResults.find(
                          (c) => (c._id || c.id) === currentBill.customerId
                        ) ||
                        customers.find(
                          (c) => (c._id || c.id) === currentBill.customerId
                        );
                      if (!selected) return null;
                      return (
                        <div>
                          <span className="font-medium">{selected.name}</span> –{" "}
                          {selected.phone}
                          {selected.gstNumber && (
                            <span className="ml-2 text-green-600">
                              GST: {selected.gstNumber}
                            </span>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Products Section */}
            <Card>
              <CardHeader>
                <CardTitle>Add Products</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Individual Product */}
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addItemToBill(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-900"
                  disabled={savingBill}
                >
                  <option value="">Select individual product</option>
                  {products.map((product) => (
                    <option
                      key={product._id || product.id}
                      value={product._id || product.id}
                    >
                      #{product.serialNumber} - {product.name} - {product.metal}{" "}
                      {product.purity} – {product.weight}g
                    </option>
                  ))}
                </select>

                {/* Bulk Inventory */}
                <Button
                  onClick={() => setShowBulkProductDialog(true)}
                  variant="secondary"
                  className="w-full flex items-center gap-2"
                  disabled={savingBill}
                >
                  <Warehouse className="w-4 h-4" /> Add from Bulk Inventory
                </Button>

                {/* Custom Product */}
                <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3">
                  <h4 className="text-sm font-medium mb-2">Custom Product</h4>

                  {/* Preview (shows live calculated amount) */}
                  {(customProductName ||
                    customProductWeight ||
                    customProductRate) && (
                    <div className="p-2 mb-2 rounded bg-zinc-50 dark:bg-zinc-800 text-sm">
                      <p>
                        <strong>{previewCustomItem.productName}</strong> –{" "}
                        {previewCustomItem.netWeight}g @{" "}
                        {previewCustomItem.rate} ={" "}
                        <span className="font-semibold">
                          {calculateItemAmount(
                            previewCustomItem as Partial<BillItem>
                          )}
                        </span>
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <Input
                      placeholder="Name"
                      value={customProductName}
                      onChange={(e) => setCustomProductName(e.target.value)}
                    />
                    <Input
                      placeholder="Weight (g)"
                      type="number"
                      value={customProductWeight}
                      onChange={(e) => setCustomProductWeight(e.target.value)}
                    />
                    <Input
                      placeholder="Rate"
                      type="number"
                      value={customProductRate}
                      onChange={(e) => setCustomProductRate(e.target.value)}
                    />
                    {/* Metal selector */}
                    <select
                      value={customProductMetal}
                      onChange={(e) =>
                        setCustomProductMetal(
                          e.target.value as "gold" | "silver" | "platinum"
                        )
                      }
                      className="px-2 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    >
                      <option value="gold">Gold</option>
                      <option value="silver">Silver</option>
                      <option value="platinum">Platinum</option>
                    </select>
                  </div>

                  <div className="mt-2 flex flex-col md:flex-row md:items-center gap-2">
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-medium mr-2">
                        Making charge mode:
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="makingMode"
                          checked={customMakingMode === "perGram"}
                          onChange={() => setCustomMakingMode("perGram")}
                        />
                        <span className="text-sm">Per-gram</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="makingMode"
                          checked={customMakingMode === "fixed"}
                          onChange={() => setCustomMakingMode("fixed")}
                        />
                        <span className="text-sm">Fixed</span>
                      </label>
                    </div>

                    <div className="ml-auto text-sm text-zinc-600 dark:text-zinc-400">
                      {customMakingMode === "perGram" ? (
                        <div>
                          Making: ₹
                          {(parseFloat(customProductWeight) || 0) *
                            (PER_GRAM_MAKING_RATE[customProductMetal] ||
                              0)}{" "}
                          (₹{PER_GRAM_MAKING_RATE[customProductMetal]}/g)
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span>Fixed Making:</span>
                          <Input
                            type="number"
                            value={customProductMaking}
                            onChange={(e) =>
                              setCustomProductMaking(e.target.value)
                            }
                            className="w-32"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={addCustomProduct}
                    variant="primary"
                    className="w-full mt-3"
                    disabled={
                      savingBill ||
                      !customProductName.trim() ||
                      !customProductWeight.trim() ||
                      !customProductRate.trim()
                    }
                  >
                    Add Custom Product
                  </Button>
                </div>
              </CardContent>
            </Card>
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
                    {currentBill.items.map((item: any) => (
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
                          <div className="text-xs text-zinc-500 mt-1">
                            {item.metal === "silver" && "₹/kg"}
                            {item.metal === "gold" && "₹/10g"}
                            {item.metal === "platinum" && "₹/g"}
                          </div>
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
                      Tax Type
                    </label>
                    <select
                      value={currentBill.taxType}
                      onChange={(e) =>
                        setCurrentBill((prev) => ({
                          ...prev,
                          taxType: e.target.value as "cgst" | "igst" | "none",
                        }))
                      }
                      className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    >
                      <option value="cgst">CGST + SGST (Intra-state)</option>
                      <option value="igst">IGST (Inter-state)</option>
                      <option value="none">No Tax</option>
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
                  {/* Show IGST row only if > 0 */}
                  {currentBillTotals.igst > 0 && (
                    <div className="flex justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        IGST (6%):
                      </span>
                      <span className="font-medium">
                        ₹{currentBillTotals.igst.toLocaleString()}
                      </span>
                    </div>
                  )}
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
              disabled={
                !currentBill.customerId ||
                !currentBill.items?.length ||
                savingBill
              }
              className="flex-1 max-h-[40px] flex items-center justify-center"
            >
              {savingBill ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  {editingBill ? "Updating..." : "Creating..."}
                </>
              ) : editingBill ? (
                "Update Bill"
              ) : (
                "Create Bill"
              )}
            </Button>
            <Button
              onClick={resetForm}
              variant="secondary"
              className="flex-1 max-h-[40px] flex items-center justify-center"
              disabled={savingBill}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bills List */}
      {!loading && (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
            <thead className="bg-zinc-100 dark:bg-zinc-800 text-sm text-zinc-600 dark:text-zinc-300">
              <tr>
                <th className="px-4 py-3 text-left">Bill #</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Items</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700 text-sm">
              {filteredBills.map((bill) => (
                <tr
                  key={
                    bill._id ||
                    bill.id ||
                    bill.billNumber ||
                    bill.date ||
                    Math.random()
                  }
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  {/* Bill Number */}
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">
                    #{bill.billNumber}
                  </td>

                  {/* Customer */}
                  <td className="px-4 py-3">
                    <p className="font-medium">{bill.customerName}</p>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                      {bill.customerPhone}
                    </p>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3">
                    {new Date(bill.date).toLocaleDateString()}
                  </td>

                  {/* Items */}
                  <td className="px-4 py-3">{bill.items.length} item(s)</td>

                  {/* Amount */}
                  <td className="px-4 py-3 font-bold text-green-600 dark:text-green-400">
                    ₹{bill.finalAmount.toLocaleString()}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
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
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleEditBill(bill)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBill(bill)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => printBill(bill)}
                        className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 p-1"
                        title="Print"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredBills.length === 0 && (
        <Card className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <Receipt className="h-12 w-12 text-zinc-400" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
            No bills found
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            {bills.length === 0
              ? "Start by creating your first bill."
              : "Try adjusting your search criteria."}
          </p>
          {bills.length === 0 && (
            <Button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 mx-auto"
            >
              <PlusCircle className="w-4 h-4" />
              Create Your First Bill
            </Button>
          )}
        </Card>
      )}

      {/* Summary */}
      {!loading && bills.length > 0 && (
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

      {/* Quick Add Customer Dialog */}
      <Dialog
        open={showQuickAddCustomerDialog}
        onOpenChange={setShowQuickAddCustomerDialog}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Name
              </label>
              <Input
                value={quickCustomerForm.name}
                onChange={(e) =>
                  setQuickCustomerForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Customer name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Phone
              </label>
              <Input
                value={quickCustomerForm.phone}
                onChange={(e) =>
                  setQuickCustomerForm((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                placeholder="Phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                GST (optional)
              </label>
              <Input
                value={quickCustomerForm.gstNumber}
                onChange={(e) =>
                  setQuickCustomerForm((prev) => ({
                    ...prev,
                    gstNumber: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="GST number"
                className="font-mono"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                onClick={createQuickCustomer}
                disabled={creatingQuickCustomer}
                className="flex-1"
              >
                {creatingQuickCustomer ? "Creating..." : "Create & Select"}
              </Button>
              <Button
                onClick={() => setShowQuickAddCustomerDialog(false)}
                variant="secondary"
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

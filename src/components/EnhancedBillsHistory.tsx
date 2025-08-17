"use client";

import React, { useState, useEffect } from "react";
import { Card, Input, Button } from "@/components/ui/enhanced";
import ExcelActions from "@/components/ExcelActions";
import {
  Receipt,
  Banknote,
  Clock,
  BarChart3,
  Eye,
  Printer,
  X,
  Search,
  Filter,
} from "lucide-react";

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

export const EnhancedBillsHistory: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // server-side pagination / filtering
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>(""); // ISO yyyy-mm-dd
  const [endDate, setEndDate] = useState<string>(""); // ISO yyyy-mm-dd
  const [sort, setSort] = useState<string>("-date");

  // Fetch with query params based on page/limit/search/status/date range/sort
  const fetchBills = async () => {
    setLoading(true);
    setError(null);
    try {
      const qp = new URLSearchParams();
      qp.set("page", String(page));
      qp.set("limit", String(limit));
      if (searchTerm.trim()) qp.set("search", searchTerm.trim());
      if (filterStatus && filterStatus !== "all") qp.set("paymentStatus", filterStatus);
      if (startDate) qp.set("startDate", startDate);
      if (endDate) qp.set("endDate", endDate);
      if (sort) qp.set("sort", sort);

      const res = await fetch(`/api/bills?${qp.toString()}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to fetch bills");
      setBills(data.data || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Error loading bills");
      setBills([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // whenever filters/pagination change, fetch
    fetchBills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, searchTerm, filterStatus, startDate, endDate, sort]);

  // server returns already paginated set; we'll sort client-side by date as fallback
  const sortedBills = [...bills].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Calculate summary statistics from current page result (you can also fetch server-side aggregates)
  const totalRevenue = bills.reduce((sum, bill) => sum + bill.finalAmount, 0);
  const pendingAmount = bills
    .filter((bill) => bill.paymentStatus === "pending")
    .reduce((sum, bill) => sum + bill.finalAmount, 0);
  const avgBillValue = bills.length > 0 ? totalRevenue / bills.length : 0;

  const printBill = (bill: Bill) => {
    // Create a printable bill format
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
                <td>${item.productName}<br><small style="color:#666;font-family:monospace;">#${item.productSerialNumber}</small></td>
                <td>${item.metal} ${item.purity}</td>
                <td>${item.netWeight}</td>
                <td>${item.rate}</td>
                <td>${item.makingCharges}${item.makingChargesType === "percentage" ? "%" : ""}</td>
                <td>${item.wastage}${item.wastageType === "percentage" ? "%" : ""}</td>
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
            ${
              (bill.igst && bill.igst > 0)
                ? `<tr><td>IGST (6%):</td><td>₹${bill.igst.toLocaleString()}</td></tr>`
                : `<tr><td>CGST (3%):</td><td>₹${bill.cgst.toLocaleString()}</td></tr>
                   <tr><td>SGST (3%):</td><td>₹${bill.sgst.toLocaleString()}</td></tr>`
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <Receipt className="h-6 w-6" />
            Bills History
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            View and manage all billing records
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExcelActions
            type="bills"
            data={bills}
            onExport={() => console.log("Bills history exported")}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Total Bills
              </p>
              <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                {total}
              </p>
            </div>
            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Receipt className="h-5 w-5 text-blue-700 dark:text-blue-300" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Total Revenue
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                ₹{totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <Banknote className="h-5 w-5 text-green-700 dark:text-green-300" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Pending Amount
              </p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                ₹{pendingAmount.toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <Clock className="h-5 w-5 text-red-700 dark:text-red-300" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Avg Bill Value
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                ₹{avgBillValue.toLocaleString()}
              </p>
            </div>
            <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-blue-700 dark:text-blue-300" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Input
                placeholder="Search bills by number, customer name, or phone..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
            </div>
          </div>
          <div>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 pl-9 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
              </select>
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
            </div>
          </div>
          {/* Date range inputs */}
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="px-2 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="px-2 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white"
            />
          </div>
          <div className="flex gap-2 items-center">
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="px-2 py-2 border border-zinc-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800"
            >
              <option value="-date">Newest</option>
              <option value="date">Oldest</option>
              <option value="-finalAmount">Highest Amount</option>
              <option value="finalAmount">Lowest Amount</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Bills List */}
      {loading ? (
        <Card className="p-8 text-center text-zinc-500">Loading bills...</Card>
      ) : error ? (
        <Card className="p-8 text-center text-red-600">{error}</Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
            <thead className="bg-zinc-100 dark:bg-zinc-800 text-sm text-zinc-600 dark:text-zinc-300">
              <tr>
                <th className="px-4 py-3 text-left">Bill #</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Payment</th>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Items</th>
                <th className="px-4 py-3 text-left">Amount</th>
                <th className="px-4 py-3 text-left">Tax (GST)</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700 text-sm">
              {sortedBills.map((bill) => (
                <React.Fragment key={bill.id}>
                  <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-white">#{bill.billNumber}</td>
                    <td className="px-4 py-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        bill.paymentStatus === "paid"
                          ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300"
                          : bill.paymentStatus === "pending"
                          ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300"
                          : "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300"
                      }`}>
                        {bill.paymentStatus.charAt(0).toUpperCase() + bill.paymentStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                        {bill.paymentMode.replace("_", " ").toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{bill.customerName}</p>
                      <p className="text-zinc-500 dark:text-zinc-400 text-xs">{bill.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{new Date(bill.date).toLocaleDateString()}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{new Date(bill.createdAt).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p>{bill.items.length} item(s)</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{bill.items.reduce((sum, item) => sum + item.netWeight, 0).toFixed(2)}g</p>
                    </td>
                    <td className="px-4 py-3 font-bold text-green-600 dark:text-green-400">
                      ₹{bill.finalAmount.toLocaleString()}
                      {bill.discount > 0 && <p className="text-red-600 dark:text-red-400 text-xs">–₹{bill.discount.toLocaleString()} (Disc.)</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p>₹{(bill.cgst + bill.sgst + bill.igst).toLocaleString()}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{bill.igst > 0 ? "IGST" : "CGST + SGST"}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => setSelectedBill(bill)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1" title="View Details"><Eye className="w-5 h-5" /></button>
                        <button onClick={() => printBill(bill)} className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 p-1" title="Print"><Printer className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </tr>
                  {bill.notes && (
                    <tr className="bg-zinc-50 dark:bg-zinc-800">
                      <td colSpan={9} className="px-4 py-2 text-sm">
                        <strong className="text-zinc-700 dark:text-zinc-300">Notes:</strong>{" "}
                        <span className="text-zinc-600 dark:text-zinc-400">{bill.notes}</span>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-zinc-600">Showing page {page} of {totalPages} — {total} records</div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} variant="secondary">Previous</Button>
              <div className="text-sm">Page {page}</div>
              <Button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} variant="secondary">Next</Button>
            </div>
          </div>
        </div>
      )}

      {(!loading && bills.length === 0) && (
        <Card className="p-8 text-center">
          <div className="flex justify-center mb-4">
            <Receipt className="h-12 w-12 text-zinc-400" strokeWidth={1} />
          </div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-2">
            No bills found
          </h3>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            {total === 0
              ? "No bills have been created yet."
              : "Try adjusting your search or filter criteria."}
          </p>
        </Card>
      )}

      {/* Bill Details Modal */}
      {selectedBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                  Bill Details - #{selectedBill.billNumber}
                </h2>
                <button
                  onClick={() => setSelectedBill(null)}
                  className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
                    Customer Information
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Name:</strong> {selectedBill.customerName}
                    </p>
                    <p>
                      <strong>Phone:</strong> {selectedBill.customerPhone}
                    </p>
                    {selectedBill.customerGST && (
                      <p>
                        <strong>GST:</strong> {selectedBill.customerGST}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
                    Bill Information
                  </h3>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Date:</strong>{" "}
                      {new Date(selectedBill.date).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Payment Mode:</strong>{" "}
                      {selectedBill.paymentMode.replace("_", " ").toUpperCase()}
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      {selectedBill.paymentStatus.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">
                  Items
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-zinc-200 dark:border-zinc-700">
                    <thead className="bg-zinc-50 dark:bg-zinc-700">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-300">
                          Product
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-300">
                          Metal/Purity
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-300">
                          Weight
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-300">
                          Rate
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-300">
                          Making
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-300">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-zinc-800 divide-y divide-zinc-200 dark:divide-zinc-700">
                      {selectedBill.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2 text-sm text-zinc-900 dark:text-white">
                            <div>
                              <p className="font-medium">{item.productName}</p>
                              <p className="text-blue-600 dark:text-blue-400 font-mono text-xs">
                                #{item.productSerialNumber}
                              </p>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-sm text-zinc-900 dark:text-white">
                            {item.metal} {item.purity}
                          </td>
                          <td className="px-3 py-2 text-sm text-zinc-900 dark:text-white">
                            {item.netWeight}g
                          </td>
                          <td className="px-3 py-2 text-sm text-zinc-900 dark:text-white">
                            ₹{item.rate}
                          </td>
                          <td className="px-3 py-2 text-sm text-zinc-900 dark:text-white">
                            ₹{item.makingCharges}
                            {item.makingChargesType === "percentage" ? "%" : ""}
                          </td>
                          <td className="px-3 py-2 text-sm font-medium text-zinc-900 dark:text-white">
                            ₹{item.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  {selectedBill.notes && (
                    <>
                      <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
                        Notes
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {selectedBill.notes}
                      </p>
                    </>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
                    Bill Summary
                  </h3>
                  <div className="bg-zinc-50 dark:bg-zinc-700 rounded-lg p-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{selectedBill.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span className="text-red-600">
                        -₹{selectedBill.discount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>CGST (3%):</span>
                      <span>₹{selectedBill.cgst.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SGST (3%):</span>
                      <span>₹{selectedBill.sgst.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-zinc-300 dark:border-zinc-600 pt-1">
                      <div className="flex justify-between font-bold">
                        <span>Total Amount:</span>
                        <span className="text-green-600">
                          ₹{selectedBill.finalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <Button
                  onClick={() => printBill(selectedBill)}
                  className="flex items-center gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Print Bill
                </Button>
                <Button
                  onClick={() => setSelectedBill(null)}
                  variant="secondary"
                >
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
   
import React, { useState } from "react";
import { Bill, PaymentStatus } from "@/types/billing";
import { BillingCalculator } from "@/utils/billing";
import { Button, Input, Card, Badge, Modal } from "@/components/ui";

interface BillDetailModalProps {
  bill: Bill | null;
  isOpen: boolean;
  onClose: () => void;
}

const BillDetailModal: React.FC<BillDetailModalProps> = ({
  bill,
  isOpen,
  onClose,
}) => {
  if (!bill) return null;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Bill ${bill.billNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .customer-info { margin-bottom: 20px; }
            .bill-items { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .bill-items th, .bill-items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .bill-items th { background-color: #f2f2f2; }
            .totals { margin-top: 20px; }
            .grand-total { font-size: 18px; font-weight: bold; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>SHUBHAM JEWELLERS</h1>
            <p>Address: [Shop Address] | Phone: [Phone Number]</p>
            <p>GST No: [GST Number] | Email: [Email]</p>
          </div>
          
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div>
              <h3>Bill No: ${bill.billNumber}</h3>
              <p>Date: ${new Date(bill.date).toLocaleDateString()}</p>
            </div>
          </div>
          
          <div class="customer-info">
            <h3>Bill To:</h3>
            <p><strong>${bill.customer.name}</strong></p>
            <p>Phone: ${bill.customer.phone}</p>
            ${bill.customer.email ? `<p>Email: ${bill.customer.email}</p>` : ""}
            ${
              bill.customer.address
                ? `
              <p>Address: ${bill.customer.address.street}, ${bill.customer.address.city}, 
              ${bill.customer.address.state} - ${bill.customer.address.pincode}</p>
            `
                : ""
            }
            ${
              bill.customer.gstNumber
                ? `<p>GST No: ${bill.customer.gstNumber}</p>`
                : ""
            }
          </div>
          
          <table class="bill-items">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Product Description</th>
                <th>HSN</th>
                <th>Weight (g)</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Making</th>
                <th>Discount</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${bill.items
                .map(
                  (item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>
                    ${item.product.name}<br>
                    <small>${item.product.category} - ${
                    item.product.material
                  } ${item.product.purity}</small>
                    ${
                      item.product.stoneDetails &&
                      item.product.stoneDetails.length > 0
                        ? `<br><small>Stones: ${item.product.stoneDetails
                            .map((s) => `${s.count} ${s.type}(s)`)
                            .join(", ")}</small>`
                        : ""
                    }
                  </td>
                  <td>${item.product.hsn || ""}</td>
                  <td>${item.product.weight}</td>
                  <td>${item.quantity}</td>
                  <td>₹${item.product.basePrice}</td>
                  <td>${item.product.makingCharges}%</td>
                  <td>${item.discount}%</td>
                  <td>₹${item.finalPrice.toLocaleString()}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          
          <div class="totals" style="margin-left: auto; width: 300px;">
            <table style="width: 100%;">
              <tr><td>Subtotal:</td><td style="text-align: right;">₹${bill.subtotal.toLocaleString()}</td></tr>
              <tr><td>Total Discount:</td><td style="text-align: right;">₹${bill.totalDiscount.toLocaleString()}</td></tr>
              <tr><td>Taxable Amount:</td><td style="text-align: right;">₹${bill.taxableAmount.toLocaleString()}</td></tr>
              <tr><td>CGST (3%):</td><td style="text-align: right;">₹${bill.cgst.toLocaleString()}</td></tr>
              <tr><td>SGST (3%):</td><td style="text-align: right;">₹${bill.sgst.toLocaleString()}</td></tr>
              <tr class="grand-total"><td>Grand Total:</td><td style="text-align: right;">₹${bill.grandTotal.toLocaleString()}</td></tr>
            </table>
          </div>
          
          <div style="margin-top: 30px;">
            <p><strong>Amount in Words:</strong> ${BillingCalculator.numberToWords(
              bill.grandTotal
            )}</p>
            <p><strong>Payment Method:</strong> ${bill.paymentMethod}</p>
            <p><strong>Payment Status:</strong> ${bill.paymentStatus}</p>
            ${bill.notes ? `<p><strong>Notes:</strong> ${bill.notes}</p>` : ""}
          </div>
          
          <div style="margin-top: 50px; text-align: center;">
            <p>Thank you for your business!</p>
            <p style="margin-top: 30px;">_______________________</p>
            <p>Authorized Signature</p>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Bill ${bill.billNumber}`}
      size="xl"
    >
      <div className="space-y-6">
        {/* Customer Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold mb-2">Customer Details</h4>
            <p>
              <strong>Name:</strong> {bill.customer.name}
            </p>
            <p>
              <strong>Phone:</strong> {bill.customer.phone}
            </p>
            {bill.customer.email && (
              <p>
                <strong>Email:</strong> {bill.customer.email}
              </p>
            )}
            {bill.customer.gstNumber && (
              <p>
                <strong>GST No:</strong> {bill.customer.gstNumber}
              </p>
            )}
          </div>
          <div>
            <h4 className="font-semibold mb-2">Bill Information</h4>
            <p>
              <strong>Date:</strong> {new Date(bill.date).toLocaleDateString()}
            </p>
            <p>
              <strong>Payment Method:</strong> {bill.paymentMethod}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              <Badge
                variant={
                  bill.paymentStatus === PaymentStatus.PAID
                    ? "success"
                    : "warning"
                }
              >
                {bill.paymentStatus}
              </Badge>
            </p>
          </div>
        </div>

        {/* Items */}
        <div>
          <h4 className="font-semibold mb-2">Items</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-zinc-300">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-zinc-500">
                    Product
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-zinc-500">
                    Material
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-zinc-500">
                    Weight
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-zinc-500">
                    Qty
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-zinc-500">
                    Discount
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-zinc-500">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {bill.items.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2">
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-zinc-500">
                          {item.product.category}
                        </p>
                        {item.product.stoneDetails &&
                          item.product.stoneDetails.length > 0 && (
                            <p className="text-xs text-zinc-400">
                              Stones:{" "}
                              {item.product.stoneDetails
                                .map((s) => `${s.count} ${s.type}(s)`)
                                .join(", ")}
                            </p>
                          )}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {item.product.material} {item.product.purity}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {item.product.weight}g
                    </td>
                    <td className="px-4 py-2 text-sm">{item.quantity}</td>
                    <td className="px-4 py-2 text-sm">{item.discount}%</td>
                    <td className="px-4 py-2 font-medium">
                      ₹{item.finalPrice.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div></div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{bill.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Discount:</span>
                <span className="text-red-600">
                  -₹{bill.totalDiscount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Taxable Amount:</span>
                <span>₹{bill.taxableAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>CGST (3%):</span>
                <span>₹{bill.cgst.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST (3%):</span>
                <span>₹{bill.sgst.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Grand Total:</span>
                <span>₹{bill.grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 border-t pt-4">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handlePrint}>Print Bill</Button>
        </div>
      </div>
    </Modal>
  );
};

export const BillHistory: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    startDate: "",
    endDate: "",
  });

  // New: Fetch bills from backend
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setLoading(true);
    fetch("/api/bills")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch bills");
        console.log("Fetching bills...");
        const data = await res.json();
        setBills(data.data || []);
        console.log("Bills loaded:", data.data);
        setError(null);
      })
      .catch((err) => setError(err.message || "Error loading bills"))
      .finally(() => setLoading(false));
  }, []);

  // Remove useBilling searchBills, use local filter
  const displayBills = bills.filter((bill : any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (bill.billNumber && String(bill.billNumber).toLowerCase().includes(q)) ||
      (bill.customerName && bill.customerName.toLowerCase().includes(q)) ||
      (bill.customerPhone && bill.customerPhone.includes(q))
    );
  });

  const filteredBills = displayBills.filter((bill) => {
    if (!dateFilter.startDate || !dateFilter.endDate) return true;
    const billDate = new Date(bill.date);
    const startDate = new Date(dateFilter.startDate);
    const endDate = new Date(dateFilter.endDate);
    return billDate >= startDate && billDate <= endDate;
  });

  // Remove updateBillPaymentStatus, just local UI for now
  const handleViewBill = (bill: Bill) => {
    setSelectedBill(bill);
    setIsDetailModalOpen(true);
  };

  // Totals
  const totalSales = filteredBills.reduce(
    (total, bill : any) => total + (bill.finalAmount || bill.grandTotal || 0),
    0
  );
  const paidBills = filteredBills.filter(
    (bill : any) =>
      bill.paymentStatus === "paid" ||
      bill.paymentStatus === "PAID" ||
      bill.paymentStatus === "Paid"
  );
  const pendingBills = filteredBills.filter(
    (bill : any) =>
      bill.paymentStatus === "pending" ||
      bill.paymentStatus === "PENDING" ||
      bill.paymentStatus === "Pending"
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {filteredBills.length}
            </p>
            <p className="text-sm text-zinc-600">Total Bills</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              ₹{totalSales.toLocaleString()}
            </p>
            <p className="text-sm text-zinc-600">Total Sales</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {paidBills.length}
            </p>
            <p className="text-sm text-zinc-600">Paid Bills</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {pendingBills.length}
            </p>
            <p className="text-sm text-zinc-600">Pending Bills</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card title="Filters">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Search by bill number, customer name, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Input
            type="date"
            label="From Date"
            value={dateFilter.startDate}
            onChange={(e) =>
              setDateFilter((prev) => ({ ...prev, startDate: e.target.value }))
            }
          />
          <Input
            type="date"
            label="To Date"
            value={dateFilter.endDate}
            onChange={(e) =>
              setDateFilter((prev) => ({ ...prev, endDate: e.target.value }))
            }
          />
        </div>
      </Card>

      {/* Bills List */}
      <Card title="Bills History">
        {loading ? (
          <div className="p-8 text-center text-zinc-500">Loading bills...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-zinc-300">
              <thead className="bg-zinc-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-zinc-500">
                    Bill No.
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-zinc-500">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-zinc-500">
                    Customer
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-zinc-500">
                    Items
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-zinc-500">
                    Amount
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-zinc-500">
                    Payment
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-zinc-500">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-zinc-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {filteredBills.map((bill : any) => (
                  <tr key={bill._id || bill.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-2 font-medium">{bill.billNumber}</td>
                    <td className="px-4 py-2 text-sm">
                      {bill.date
                        ? new Date(bill.date).toLocaleDateString()
                        : ""}
                    </td>
                    <td className="px-4 py-2">
                      <div>
                        <p className="font-medium">
                          {bill.customerName || bill.customer?.name}
                        </p>
                        <p className="text-sm text-zinc-500">
                          {bill.customerPhone || bill.customer?.phone}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {bill.items?.length || 0} item(s)
                    </td>
                    <td className="px-4 py-2 font-medium">
                      ₹
                      {(
                        bill.finalAmount ||
                        bill.grandTotal ||
                        0
                      ).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-sm">
                      {bill.paymentMode || bill.paymentMethod}
                    </td>
                    <td className="px-4 py-2">
                      <Badge
                        variant={
                          bill.paymentStatus === "paid" ||
                          bill.paymentStatus === "PAID" ||
                          bill.paymentStatus === "Paid"
                            ? "success"
                            : bill.paymentStatus === "pending" ||
                              bill.paymentStatus === "PENDING" ||
                              bill.paymentStatus === "Pending"
                            ? "warning"
                            : "danger"
                        }
                      >
                        {bill.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 space-x-2">
                      <Button size="sm" onClick={() => handleViewBill(bill)}>
                        View
                      </Button>
                      {/* Optionally, add Mark Paid button if you implement backend update */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <BillDetailModal
        bill={selectedBill}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedBill(null);
        }}
      />
    </div>
  );
};

export interface BillItem {
  _id?: string;
  id?: string;
  productId: string;
  productSerialNumber: string;
  productName: string;
  category: string;
  metal: "gold" | "silver" | "platinum";
  purity: string;
  weight: number;
  stoneWeight?: number;
  netWeight: number;
  packageWeight?: number; // Add package weight field
  rate: number;
  makingCharges: number;
  makingChargesType: "fixed" | "percentage";
  wastage: number;
  wastageType: "fixed" | "percentage";
  amount: number;
  bulkProductId?: string; // Add bulk product reference
  isFromBulk?: boolean; // Flag to identify bulk items
}

export interface Bill {
  _id?: string;
  id?: string;
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
  createdAt?: string;
  updatedAt?: string;
}

import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBillItem {
  productId: Types.ObjectId;
  productSerialNumber: string;
  productName: string;
  category: string;
  metal: string;
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

export interface IBill extends Document {
  billNumber: string;
  date: Date;
  customerId: Types.ObjectId;
  customerName: string;
  customerPhone: string;
  customerGST?: string;
  items: IBillItem[];
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
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BillItemSchema = new Schema<IBillItem>({
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  productSerialNumber: {
    type: String,
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  metal: {
    type: String,
    required: true,
  },
  purity: {
    type: String,
    required: true,
  },
  weight: {
    type: Number,
    required: true,
  },
  stoneWeight: {
    type: Number,
  },
  netWeight: {
    type: Number,
    required: true,
  },
  rate: {
    type: Number,
    required: true,
  },
  makingCharges: {
    type: Number,
    required: true,
  },
  makingChargesType: {
    type: String,
    enum: ["fixed", "percentage"],
    required: true,
  },
  wastage: {
    type: Number,
    required: true,
  },
  wastageType: {
    type: String,
    enum: ["fixed", "percentage"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
});

const BillSchema = new Schema<IBill>(
  {
    billNumber: {
      type: String,
      required: true,
      unique: true,
      index: true, // Only this index, remove .index() below for billNumber
    },
    date: {
      type: Date,
      required: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    customerGST: {
      type: String,
    },
    items: [BillItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    cgst: {
      type: Number,
      required: true,
    },
    sgst: {
      type: Number,
      required: true,
    },
    igst: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      default: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
    },
    paymentMode: {
      type: String,
      enum: ["cash", "card", "upi", "bank_transfer", "cheque", "partial"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "pending", "partial"],
      required: true,
    },
    notes: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

let BillModel: any;
if (typeof window === "undefined") {
  // Only create indexes and export model on server
  BillSchema.index({ customerId: 1 });
  BillSchema.index({ date: -1 });
  BillSchema.index({ paymentStatus: 1 });
  // Always use "Bill" as the model name and check mongoose.models.Bill
  BillModel = mongoose.models.Bill || mongoose.model<IBill>("Bill", BillSchema);
} else {
  BillModel = undefined;
}

export default BillModel;

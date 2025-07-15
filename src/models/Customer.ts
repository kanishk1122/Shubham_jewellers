import mongoose, { Schema, Document } from "mongoose";

export interface ICustomer extends Document {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  panNumber?: string;
  notes?: string;
  totalPurchases: number;
  lastPurchaseDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Only create schema and model on server side
let CustomerModel: any = null;

if (typeof window === "undefined") {
  const CustomerSchema = new Schema<ICustomer>(
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      phone: {
        type: String,
        required: true,
        index: true,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
      address: {
        type: String,
        trim: true,
      },
      gstNumber: {
        type: String,
        trim: true,
        uppercase: true,
      },
      panNumber: {
        type: String,
        trim: true,
        uppercase: true,
      },
      notes: {
        type: String,
        trim: true,
      },
      totalPurchases: {
        type: Number,
        default: 0,
        min: 0,
      },
      lastPurchaseDate: {
        type: Date,
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

  // Create indexes for better performance
  CustomerSchema.index({ phone: 1 });
  CustomerSchema.index({ email: 1 });
  CustomerSchema.index({ gstNumber: 1 });
  CustomerSchema.index({ name: "text", email: "text", phone: "text" });

  CustomerModel =
    mongoose.models.Customer ||
    mongoose.model<ICustomer>("Customer", CustomerSchema);
}

export default CustomerModel;

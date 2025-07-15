import mongoose, { Schema, Document } from "mongoose";

export interface IBulkProduct extends Document {
  name: string;
  category:
    | "ring"
    | "necklace"
    | "bracelet"
    | "earring"
    | "pendant"
    | "chain"
    | "other";
  metal: "gold" | "silver" | "platinum";
  purity: string;
  totalWeight: number; // Total weight purchased in bulk
  remainingWeight: number; // Remaining weight available
  packageWeight: number; // Weight per individual unit/package
  unitPrice: number; // Price per gram
  makingCharges: number; // Making charges per unit
  supplier?: string;
  purchaseDate: Date;
  batchNumber?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Only create schema and model on server side
let BulkProductModel: any = null;

if (typeof window === "undefined") {
  const BulkProductSchema = new Schema<IBulkProduct>(
    {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      category: {
        type: String,
        required: true,
        enum: [
          "ring",
          "necklace",
          "bracelet",
          "earring",
          "pendant",
          "chain",
          "other",
        ],
      },
      metal: {
        type: String,
        required: true,
        enum: ["gold", "silver", "platinum"],
      },
      purity: {
        type: String,
        required: true,
      },
      totalWeight: {
        type: Number,
        required: true,
        min: 0,
      },
      remainingWeight: {
        type: Number,
        required: true,
        min: 0,
      },
      packageWeight: {
        type: Number,
        required: true,
        min: 0,
      },
      unitPrice: {
        type: Number,
        required: true,
        min: 0,
      },
      makingCharges: {
        type: Number,
        required: true,
        min: 0,
      },
      supplier: {
        type: String,
        trim: true,
      },
      purchaseDate: {
        type: Date,
        required: true,
      },
      batchNumber: {
        type: String,
        trim: true,
      },
      notes: {
        type: String,
        trim: true,
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
  BulkProductSchema.index({ category: 1, metal: 1, purity: 1 });
  BulkProductSchema.index({ remainingWeight: 1 });
  BulkProductSchema.index({ isActive: 1 });

  BulkProductModel =
    mongoose.models.BulkProduct ||
    mongoose.model<IBulkProduct>("BulkProduct", BulkProductSchema);
}

export default BulkProductModel;

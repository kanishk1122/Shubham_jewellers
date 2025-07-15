import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  serialNumber: string;
  slug: string;
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
  weight: number;
  stoneWeight?: number;
  makingCharges: number;
  description: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    serialNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      index: true,
    },
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
    weight: {
      type: Number,
      required: true,
      min: 0,
    },
    stoneWeight: {
      type: Number,
      min: 0,
    },
    makingCharges: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
    },
    imageUrl: {
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

// Create indexes for better performance (server-side only)
if (typeof window === "undefined") {
  ProductSchema.index({ serialNumber: 1 });
  ProductSchema.index({ category: 1, metal: 1 });
  ProductSchema.index({ name: "text", description: "text" });
}

export default (typeof window === "undefined"
  ? mongoose.models.Product ||
    mongoose.model<IProduct>("Product", ProductSchema)
  : null) as any;

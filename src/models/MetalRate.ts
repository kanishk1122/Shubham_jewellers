import mongoose, { Schema, Document } from "mongoose";

export interface IMetalRate extends Document {
  metal: "gold" | "silver" | "platinum";
  purity: string;
  rate: number;
  unit: string;
  source: "narnoli" | "jaipur" | "manual" | "api";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MetalRateSchema = new Schema<IMetalRate>(
  {
    metal: {
      type: String,
      required: true,
      enum: ["gold", "silver", "platinum"],
    },
    purity: {
      type: String,
      required: true,
    },
    rate: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      default: "per gram",
    },
    source: {
      type: String,
      enum: ["narnoli", "jaipur", "manual", "api"],
      default: "manual",
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

// Create compound index for metal and purity
MetalRateSchema.index({ metal: 1, purity: 1, source: 1 });

export default mongoose.models.MetalRate ||
  mongoose.model<IMetalRate>("MetalRate", MetalRateSchema);

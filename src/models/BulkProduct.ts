import mongoose, { Schema, Document } from "mongoose";

export interface IBulkProduct extends Document {
  name: string;
  slug: string;
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
  totalWeight: number;
  remainingWeight: number;
  packageWeight: number;
  makingCharges: number;
  supplier?: string;
  purchaseDate: Date;
  batchNumber?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Generate slug function
const generateBulkSlug = (
  name: string,
  supplier: string,
  purchaseDate: Date
): string => {
  const dateStr = purchaseDate.toISOString().slice(2, 10).replace(/-/g, ""); // YYMMDD
  const hour = purchaseDate.getHours().toString().padStart(2, "0");

  const supplierCode = supplier
    ? supplier.substring(0, 3).toLowerCase().replace(/\s/g, "")
    : "sp";

  const nameCode = name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toLowerCase()
    .substring(0, 3);

  return `${supplierCode}-${nameCode}-${dateStr}-${hour}`;
};

const BulkProductSchema = new Schema<IBulkProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: false, // Change to false since it's auto-generated
      unique: true,
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

// Pre-save middleware to generate slug
BulkProductSchema.pre("save", function (next) {
  // Always generate slug for new documents or when key fields change
  if (
    this.isNew ||
    this.isModified("name") ||
    this.isModified("supplier") ||
    this.isModified("purchaseDate")
  ) {
    // Use current date if purchaseDate is not set
    const date = this.purchaseDate || new Date();
    this.slug = generateBulkSlug(this.name, this.supplier || "", date);
  }
  next();
});

const BulkProduct =
  mongoose.models.BulkProduct ||
  mongoose.model<IBulkProduct>("BulkProduct", BulkProductSchema);

export default BulkProduct;

import mongoose, { Schema, Document } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Only create schema and model on server side
let CategoryModel: any = null;

if (typeof window === "undefined") {
  const CategorySchema = new Schema<ICategory>(
    {
      name: {
        type: String,
        required: true,
        trim: true,
        unique: true,
      },
      slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
      },
      description: {
        type: String,
        trim: true,
      },
      icon: {
        type: String,
        trim: true,
      },
      color: {
        type: String,
        trim: true,
        default: "#3B82F6",
      },
      isActive: {
        type: Boolean,
        default: true,
      },
      productCount: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    {
      timestamps: true,
    }
  );

  // Create indexes for better performance
  CategorySchema.index({ name: 1 });
  CategorySchema.index({ slug: 1 });
  CategorySchema.index({ isActive: 1 });

  CategoryModel =
    mongoose.models.Category ||
    mongoose.model<ICategory>("Category", CategorySchema);
}

export default CategoryModel;

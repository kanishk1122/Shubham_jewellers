import connectDB from "@/lib/mongodb";
import Product, { IProduct } from "@/models/Product";

interface Product {
  _id?: string;
  id?: string;
  serialNumber: string;
  slug: string;
  name: string;
  category: string;
  metal: "gold" | "silver" | "platinum";
  purity: string;
  weight: number;
  stoneWeight?: number;
  makingCharges: number;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export class ProductService {
  private static readonly API_BASE = "/api/products";

  static async createProduct(
    productData: Partial<IProduct>
  ): Promise<IProduct> {
    await connectDB();

    // Generate serial number if not provided
    if (!productData.serialNumber) {
      const lastProduct = await Product.findOne(
        {},
        {},
        { sort: { createdAt: -1 } }
      );
      const nextNumber = lastProduct
        ? parseInt(lastProduct.serialNumber) + 1
        : 1;
      productData.serialNumber = nextNumber.toString();
    }

    const product = new Product(productData);
    return await product.save();
  }

  static async getAllProducts(): Promise<{
    success: boolean;
    data?: Product[];
    error?: string;
  }> {
    try {
      const response = await fetch(this.API_BASE);
      const result = await response.json();

      if (response.ok) {
        return { success: true, data: result.data };
      } else {
        return {
          success: false,
          error: result.error || "Failed to fetch products",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  static async getProductById(id: string): Promise<IProduct | null> {
    await connectDB();
    return await Product.findById(id);
  }

  static async updateProduct(
    id: string,
    updateData: Partial<IProduct>
  ): Promise<IProduct | null> {
    await connectDB();
    return await Product.findByIdAndUpdate(id, updateData, { new: true });
  }

  static async deleteProduct(id: string): Promise<boolean> {
    await connectDB();
    const result = await Product.findByIdAndUpdate(id, { isActive: false });
    return !!result;
  }

  static async searchProducts(query: string): Promise<IProduct[]> {
    await connectDB();
    return await Product.find({
      $and: [
        { isActive: true },
        {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
            { serialNumber: { $regex: query, $options: "i" } },
            { slug: { $regex: query, $options: "i" } },
          ],
        },
      ],
    });
  }
}

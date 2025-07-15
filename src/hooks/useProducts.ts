import { useState, useEffect, useCallback } from "react";

export interface Product {
  _id?: string;
  id?: string;
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
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductResponse {
  success: boolean;
  data?: Product | Product[];
  error?: string;
  message?: string;
  pagination?: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
}

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load products from API
  const loadProducts = useCallback(
    async (filters?: {
      search?: string;
      category?: string;
      metal?: string;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const url = new URL("/api/products", window.location.origin);
        if (filters?.search) url.searchParams.set("search", filters.search);
        if (filters?.category)
          url.searchParams.set("category", filters.category);
        if (filters?.metal) url.searchParams.set("metal", filters.metal);

        const response = await fetch(url.toString());
        const result: ProductResponse = await response.json();

        if (result.success && Array.isArray(result.data)) {
          setProducts(result.data);
        } else {
          setError(result.error || "Failed to load products");
        }
      } catch (error) {
        console.error("Failed to load products:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Create new product
  const createProduct = useCallback(
    async (
      productData: Omit<
        Product,
        "_id" | "id" | "serialNumber" | "slug" | "createdAt" | "updatedAt"
      >
    ) => {
      try {
        const response = await fetch("/api/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(productData),
        });

        const result: ProductResponse = await response.json();

        if (result.success && result.data && !Array.isArray(result.data)) {
          setProducts((prev) => [result.data as Product, ...prev]);
          return { success: true, data: result.data };
        } else {
          return {
            success: false,
            error: result.error || "Failed to create product",
          };
        }
      } catch (error) {
        console.error("Failed to create product:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    []
  );

  // Update product
  const updateProduct = useCallback(
    async (productId: string, productData: Partial<Product>) => {
      try {
        const response = await fetch(`/api/products/${productId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(productData),
        });

        const result: ProductResponse = await response.json();

        if (result.success && result.data && !Array.isArray(result.data)) {
          setProducts((prev) =>
            prev.map((product) =>
              (product._id || product.id) === productId
                ? (result.data as Product)
                : product
            )
          );
          return { success: true, data: result.data };
        } else {
          return {
            success: false,
            error: result.error || "Failed to update product",
          };
        }
      } catch (error) {
        console.error("Failed to update product:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    []
  );

  // Delete product
  const deleteProduct = useCallback(async (productId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
      });

      const result: ProductResponse = await response.json();

      if (result.success) {
        setProducts((prev) =>
          prev.filter((product) => (product._id || product.id) !== productId)
        );
        return { success: true };
      } else {
        return {
          success: false,
          error: result.error || "Failed to delete product",
        };
      }
    } catch (error) {
      console.error("Failed to delete product:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }, []);

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  return {
    products,
    loading,
    error,
    loadProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
};

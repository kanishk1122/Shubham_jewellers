import { useState, useEffect, useCallback } from "react";

export interface BulkProduct {
  _id?: string;
  id?: string;
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
  totalWeight: number;
  remainingWeight: number;
  packageWeight: number;
  unitPrice?: number; // MAKE OPTIONAL
  makingCharges: number;
  supplier?: string;
  purchaseDate: string;
  batchNumber?: string;
  notes?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BulkProductResponse {
  success: boolean;
  data?: BulkProduct | BulkProduct[];
  error?: string;
  message?: string;
}

export const useBulkProducts = () => {
  const [bulkProducts, setBulkProducts] = useState<BulkProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load bulk products from API
  const loadBulkProducts = useCallback(
    async (filters?: {
      category?: string;
      metal?: string;
      purity?: string;
      availableOnly?: boolean;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const url = new URL("/api/bulk-products", window.location.origin);
        if (filters?.category)
          url.searchParams.set("category", filters.category);
        if (filters?.metal) url.searchParams.set("metal", filters.metal);
        if (filters?.purity) url.searchParams.set("purity", filters.purity);
        if (filters?.availableOnly)
          url.searchParams.set("availableOnly", "true");

        const response = await fetch(url.toString());
        const result: BulkProductResponse = await response.json();

        if (result.success && Array.isArray(result.data)) {
          setBulkProducts(result.data);
        } else {
          setError(result.error || "Failed to load bulk products");
        }
      } catch (error) {
        console.error("Failed to load bulk products:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Create new bulk product
  const createBulkProduct = useCallback(
    async (
      productData: Omit<
        BulkProduct,
        "_id" | "id" | "remainingWeight" | "createdAt" | "updatedAt"
      >
    ) => {
      try {
        const response = await fetch("/api/bulk-products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(productData),
        });

        const result: BulkProductResponse = await response.json();

        if (result.success && result.data && !Array.isArray(result.data)) {
          setBulkProducts((prev) => [result.data as BulkProduct, ...prev]);
          return { success: true, data: result.data };
        } else {
          return {
            success: false,
            error: result.error || "Failed to create bulk product",
          };
        }
      } catch (error) {
        console.error("Failed to create bulk product:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    []
  );

  // Update bulk product
  const updateBulkProduct = useCallback(
    async (productId: string, productData: Partial<BulkProduct>) => {
      try {
        const response = await fetch(`/api/bulk-products/${productId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(productData),
        });

        const result: BulkProductResponse = await response.json();

        if (result.success && result.data && !Array.isArray(result.data)) {
          setBulkProducts((prev) =>
            prev.map((product) =>
              (product._id || product.id) === productId
                ? (result.data as BulkProduct)
                : product
            )
          );
          return { success: true, data: result.data };
        } else {
          return {
            success: false,
            error: result.error || "Failed to update bulk product",
          };
        }
      } catch (error) {
        console.error("Failed to update bulk product:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    []
  );

  // Delete bulk product
  const deleteBulkProduct = useCallback(async (productId: string) => {
    try {
      const response = await fetch(`/api/bulk-products/${productId}`, {
        method: "DELETE",
      });

      const result: BulkProductResponse = await response.json();

      if (result.success) {
        setBulkProducts((prev) =>
          prev.filter((product) => (product._id || product.id) !== productId)
        );
        return { success: true };
      } else {
        return {
          success: false,
          error: result.error || "Failed to delete bulk product",
        };
      }
    } catch (error) {
      console.error("Failed to delete bulk product:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }, []);

  // Deduct weight from bulk product
  const deductWeight = useCallback(
    async (productId: string, weight: number) => {
      try {
        const response = await fetch(`/api/bulk-products/${productId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ deductWeight: weight }),
        });

        const result: BulkProductResponse = await response.json();

        if (result.success && result.data && !Array.isArray(result.data)) {
          setBulkProducts((prev) =>
            prev.map((product) =>
              (product._id || product.id) === productId
                ? (result.data as BulkProduct)
                : product
            )
          );
          return { success: true, data: result.data };
        } else {
          return {
            success: false,
            error: result.error || "Failed to deduct weight",
          };
        }
      } catch (error) {
        console.error("Failed to deduct weight:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    []
  );

  // Load bulk products on component mount
  useEffect(() => {
    loadBulkProducts();
  }, [loadBulkProducts]);

  return {
    bulkProducts,
    loading,
    error,
    loadBulkProducts,
    createBulkProduct,
    updateBulkProduct,
    deleteBulkProduct,
    deductWeight,
  };
};

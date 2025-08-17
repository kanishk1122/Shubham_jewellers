import axios from "axios";
import { useState, useEffect, useCallback } from "react";

export interface Category {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryResponse {
  success: boolean;
  data?: Category | Category[];
  error?: string;
  message?: string;
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load categories from API
  const loadCategories = useCallback(async (activeOnly: boolean = true) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/categories", window.location.origin);
      if (activeOnly) url.searchParams.set("activeOnly", "true");

      const response = await axios.get(url.toString());
      const result: CategoryResponse = response.data;

      if (result.success && Array.isArray(result.data)) {
        setCategories(result.data);
      } else {
        setError(result.error || "Failed to load categories");
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new category
  const createCategory = useCallback(
    async (
      categoryData: Omit<
        Category,
        "_id" | "id" | "slug" | "productCount" | "createdAt" | "updatedAt"
      >
    ) => {
      try {
        const response = await axios.post("/api/categories", categoryData);

        const result: CategoryResponse = response.data;

        if (result.success && result.data && !Array.isArray(result.data)) {
          setCategories((prev) => [result.data as Category, ...prev]);
          return { success: true, data: result.data };
        } else {
          return {
            success: false,
            error: result.error || "Failed to create category",
          };
        }
      } catch (error) {
        console.error("Failed to create category:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    []
  );

  // Update category
  const updateCategory = useCallback(
    async (categoryId: string, categoryData: Partial<Category>) => {
      try {
        const response = await axios.put(`/api/categories/${categoryId}`, categoryData);

        const result: CategoryResponse = response.data;

        if (result.success && result.data && !Array.isArray(result.data)) {
          setCategories((prev) =>
            prev.map((category) =>
              (category._id || category.id) === categoryId
                ? (result.data as Category)
                : category
            )
          );
          return { success: true, data: result.data };
        } else {
          return {
            success: false,
            error: result.error || "Failed to update category",
          };
        }
      } catch (error) {
        console.error("Failed to update category:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    []
  );

  // Delete category
  const deleteCategory = useCallback(async (categoryId: string) => {
    try {
      const response = await axios.delete(`/api/categories/${categoryId}`);

      const result: CategoryResponse = response.data;

      if (result.success) {
        setCategories((prev) =>
          prev.filter(
            (category) => (category._id || category.id) !== categoryId
          )
        );
        return { success: true };
      } else {
        return {
          success: false,
          error: result.error || "Failed to delete category",
        };
      }
    } catch (error) {
      console.error("Failed to delete category:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }, []);

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return {
    categories,
    loading,
    error,
    loadCategories,
    createCategory,
    updateCategory,
    deleteCategory,
  };
};

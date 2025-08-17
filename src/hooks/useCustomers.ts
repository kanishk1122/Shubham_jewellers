import axios from "axios";
import { useState, useEffect, useCallback } from "react";

export interface Customer {
  _id?: string;
  id?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  panNumber?: string;
  notes?: string;
  totalPurchases: number;
  lastPurchaseDate?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerResponse {
  success: boolean;
  data?: Customer | Customer[];
  error?: string;
  message?: string;
  pagination?: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
}

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load customers from API
  const loadCustomers = useCallback(async (search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL("/api/customers", window.location.origin);
      if (search) url.searchParams.set("search", search);

      const response = await axios.get(url.toString());
      const result: CustomerResponse = response.data;

      if (result.success && Array.isArray(result.data)) {
        setCustomers(result.data);
      } else {
        setError(result.error || "Failed to load customers");
      }
    } catch (error) {
      console.error("Failed to load customers:", error);
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new customer
  const createCustomer = useCallback(
    async (
      customerData: Omit<
        Customer,
        "_id" | "id" | "totalPurchases" | "createdAt" | "updatedAt"
      >
    ) => {
      try {
        const response = await axios.post("/api/customers", customerData);

        const result: CustomerResponse = response.data;

        if (result.success && result.data && !Array.isArray(result.data)) {
          setCustomers((prev) => [result.data as Customer, ...prev]);
          return { success: true, data: result.data };
        } else {
          return {
            success: false,
            error: result.error || "Failed to create customer",
          };
        }
      } catch (error) {
        console.error("Failed to create customer:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    []
  );

  // Update customer
  const updateCustomer = useCallback(
    async (customerId: string, customerData: Partial<Customer>) => {
      try {
        const response = await axios.put(`/api/customers/${customerId}`, customerData);
        const result: CustomerResponse = response.data;

        if (result.success && result.data && !Array.isArray(result.data)) {
          setCustomers((prev) =>
            prev.map((customer) =>
              (customer._id || customer.id) === customerId
                ? (result.data as Customer)
                : customer
            )
          );
          return { success: true, data: result.data };
        } else {
          return {
            success: false,
            error: result.error || "Failed to update customer",
          };
        }
      } catch (error) {
        console.error("Failed to update customer:", error);
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    []
  );

  // Delete customer
  const deleteCustomer = useCallback(async (customerId: string) => {
    try {
      const response = await axios.delete(`/api/customers/${customerId}`);
      const result: CustomerResponse = response.data;

      if (result.success) {
        setCustomers((prev) =>
          prev.filter(
            (customer) => (customer._id || customer.id) !== customerId
          )
        );
        return { success: true };
      } else {
        return {
          success: false,
          error: result.error || "Failed to delete customer",
        };
      }
    } catch (error) {
      console.error("Failed to delete customer:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }, []);

  // Bulk import customers
  const bulkImportCustomers = async (customers: any[], options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post("/api/customers/bulk", {
        customers,
        options,
      });

      const result = response.data;

      if (result.success) {
        // Refresh the customers list
        await loadCustomers();
        return {
          success: true,
          data: result.data,
          message: result.message,
        };
      } else {
        setError(result.error || "Failed to import customers");
        return { success: false, error: result.error };
      }
    } catch (err: any) {
      const errorMessage = "Failed to import customers";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Search customers
  const searchCustomers = async (searchTerm: string, page = 1, limit = 50) => {
    try {
      const response = await axios.get("/api/customers", {
        params: {
          search: searchTerm,
          page,
          limit,
        },
      });
      const result = response.data;
      return result;
    } catch (err) {
      return { success: false, data: [], error: "Search failed" };
    }
  };

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  return {
    customers,
    loading,
    error,
    loadCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    bulkImportCustomers,
    searchCustomers,
  };
};

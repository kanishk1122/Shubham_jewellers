import connectDB from "@/lib/mongodb";
import Customer, { ICustomer } from "@/models/Customer";

interface Customer {
  _id?: string;
  id?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstNumber?: string;
  panNumber?: string;
  notes?: string;
  totalPurchases?: number;
  lastPurchaseDate?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export class CustomerService {
  private static readonly API_BASE = "/api/customers";

  static async getAllCustomers(): Promise<{
    success: boolean;
    data?: Customer[];
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
          error: result.error || "Failed to fetch customers",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  static async createCustomer(customerData: Partial<Customer>): Promise<{
    success: boolean;
    data?: Customer;
    error?: string;
  }> {
    try {
      const response = await fetch(this.API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      });

      const result = await response.json();

      if (response.ok) {
        return { success: true, data: result.data };
      } else {
        return {
          success: false,
          error: result.error || "Failed to create customer",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  static async updateCustomer(
    customerId: string,
    customerData: Partial<Customer>
  ): Promise<{
    success: boolean;
    data?: Customer;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.API_BASE}/${customerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerData),
      });

      const result = await response.json();

      if (response.ok) {
        return { success: true, data: result.data };
      } else {
        return {
          success: false,
          error: result.error || "Failed to update customer",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  static async deleteCustomer(
    customerId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.API_BASE}/${customerId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return {
          success: false,
          error: result.error || "Failed to delete customer",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  static async getCustomerById(customerId: string): Promise<{
    success: boolean;
    data?: Customer;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.API_BASE}/${customerId}`);
      const result = await response.json();

      if (response.ok) {
        return { success: true, data: result.data };
      } else {
        return {
          success: false,
          error: result.error || "Failed to fetch customer",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  static async searchCustomers(query: string): Promise<{
    success: boolean;
    data?: Customer[];
    error?: string;
  }> {
    try {
      const response = await fetch(
        `${this.API_BASE}/search?q=${encodeURIComponent(query)}`
      );
      const result = await response.json();

      if (response.ok) {
        return { success: true, data: result.data };
      } else {
        return {
          success: false,
          error: result.error || "Failed to search customers",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }
}

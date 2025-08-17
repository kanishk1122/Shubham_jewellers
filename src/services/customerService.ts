import connectDB from "@/lib/mongodb";
import Customer, { ICustomer } from "@/models/Customer";
import axios from "axios";

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
      const response = await axios.get(this.API_BASE);
      const result = response.data;

      if (response.status === 200) {
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
      const response = await axios.post(this.API_BASE, customerData);

      const result = response.data;

      if (response.status === 201) {
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
      const response = await axios.put(`${this.API_BASE}/${customerId}`, customerData);

      const result = response.data;

      if (response.status === 200) {
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
      const response = await axios.delete(`${this.API_BASE}/${customerId}`);

      if (response.status === 200 ) {
        return { success: true };
      } else {
        const result = response.data;
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
      const response = await axios.get(`${this.API_BASE}/${customerId}`);
      const result = response.data;

      if (response.status === 200) {
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
      const response = await axios.get(`${this.API_BASE}/search?q=${encodeURIComponent(query)}`);
      const result = response.data;

      if (response.status === 200) {
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

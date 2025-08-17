import type { Bill, BillItem } from "@/types/bill";
import axios from "axios";
export class BillService {
  private static readonly API_BASE = "/api/bills";

  static async getAllBills(): Promise<{
    success: boolean;
    data?: Bill[];
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
          error: result.error || "Failed to fetch bills",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  static async createBill(
    billData: Partial<Bill>
  ): Promise<{ success: boolean; data?: Bill; error?: string }> {
    try {
      const response = await axios.post(this.API_BASE, billData);

      const result = response.data;

      if (response.status === 201) {
        return { success: true, data: result.data };
      } else {
        return {
          success: false,
          error: result.error || "Failed to create bill",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  static async updateBill(
    billId: string,
    billData: Partial<Bill>
  ): Promise<{ success: boolean; data?: Bill; error?: string }> {
    try {
      const response = await axios.put(`${this.API_BASE}/${billId}`, billData);

      const result = response.data;

      if (response.status === 200) {
        return { success: true, data: result.data };
      } else {
        return {
          success: false,
          error: result.error || "Failed to update bill",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  static async deleteBill(
    billId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await axios.delete(`${this.API_BASE}/${billId}`);

      const result = response.data;

      if (response.status === 200) {
        return { success: true };
      } else {
        return {
          success: false,
          error: result.error || "Failed to delete bill",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  static async getBillById(
    billId: string
  ): Promise<{ success: boolean; data?: Bill; error?: string }> {
    try {
      const response = await axios.get(`${this.API_BASE}/${billId}`);
      const result = response.data;

      if (response.status === 200) {
        return { success: true, data: result.data };
      } else {
        return {
          success: false,
          error: result.error || "Failed to fetch bill",
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      };
    }
  }

  static async getBillsByCustomer(
    customerId: string
  ): Promise<{ success: boolean; data?: Bill[]; error?: string }> {
    try {
      const response = await axios.get(`${this.API_BASE}/customer/${customerId}`);
      const result = response.data;

      if (response.status === 200) {
        return { success: true, data: result.data };
      } else {
        return {
          success: false,
          error: result.error || "Failed to fetch customer bills",
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

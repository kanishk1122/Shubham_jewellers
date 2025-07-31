import type { Bill, BillItem } from "@/types/bill";
export class BillService {
  private static readonly API_BASE = "/api/bills";

  static async getAllBills(): Promise<{
    success: boolean;
    data?: Bill[];
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
      const response = await fetch(this.API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(billData),
      });

      const result = await response.json();

      if (response.ok) {
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
      const response = await fetch(`${this.API_BASE}/${billId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(billData),
      });

      const result = await response.json();

      if (response.ok) {
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
      const response = await fetch(`${this.API_BASE}/${billId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (response.ok) {
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
      const response = await fetch(`${this.API_BASE}/${billId}`);
      const result = await response.json();

      if (response.ok) {
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
      const response = await fetch(`${this.API_BASE}/customer/${customerId}`);
      const result = await response.json();

      if (response.ok) {
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

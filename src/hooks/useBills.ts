import { useState, useEffect } from "react";
import { BillService } from "@/services/billService";
import type { Bill } from "@/types/bill";

export function useBills() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBills = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await BillService.getAllBills();

      if (result.success && result.data) {
        setBills(result.data);
      } else {
        setError(result.error || "Failed to load bills");
        setBills([]);
      }
    } catch (error) {
      setError("Failed to load bills");
      setBills([]);
    } finally {
      setLoading(false);
    }
  };

  const createBill = async (billData: Partial<Bill>) => {
    setError(null);

    const result = await BillService.createBill(billData);

    if (result.success && result.data) {
      setBills((prev : any) => [result.data, ...prev]);
      return { success: true, data: result.data };
    } else {
      setError(result.error || "Failed to create bill");
      return { success: false, error: result.error };
    }
  };

  const updateBill = async (billId: string, billData: Partial<Bill>) => {
    setError(null);

    const result = await BillService.updateBill(billId, billData);

    if (result.success && result.data) {
      setBills((prev) =>
        prev.map((bill) =>
          (bill._id || bill.id) === billId ? result.data! : bill
        )
      );
      return { success: true, data: result.data };
    } else {
      setError(result.error || "Failed to update bill");
      return { success: false, error: result.error };
    }
  };

  const deleteBill = async (billId: string) => {
    setError(null);

    const result = await BillService.deleteBill(billId);

    if (result.success) {
      setBills((prev) =>
        prev.filter((bill) => (bill._id || bill.id) !== billId)
      );
      return { success: true };
    } else {
      setError(result.error || "Failed to delete bill");
      return { success: false, error: result.error };
    }
  };

  useEffect(() => {
    loadBills();
  }, []);

  return {
    bills,
    loading,
    error,
    loadBills,
    createBill,
    updateBill,
    deleteBill,
  };
}

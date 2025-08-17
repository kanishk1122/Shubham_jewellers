import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Bill } from "@/types/bill";

interface BillsState {
  bills: Bill[];
  loading: boolean;
  error: string | null;
  selectedBill: Bill | null;
  // pagination/meta
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const initialState: BillsState = {
  bills: [],
  loading: false,
  error: null,
  selectedBill: null,
  page: 1,
  limit: 100,
  total: 0,
  totalPages: 1,
};

// params: { page?, limit?, startDate?, endDate?, paymentStatus?, search?, sort?, tag? }
export const fetchBills = createAsyncThunk(
  "bills/fetchBills",
  async (params?: Record<string, any>, { rejectWithValue }) => {
    try {
      let url = "/api/bills";
      if (params && Object.keys(params).length > 0) {
        const qp = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && String(v).length > 0)
            qp.set(k, String(v));
        });
        url += `?${qp.toString()}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to fetch bills");
      // return structured payload with meta
      return {
        bills: data.data as Bill[],
        page: data.page || 1,
        limit: data.limit || (params?.limit ? Number(params.limit) : 100),
        total: data.total || (data.data ? (data.data as Bill[]).length : 0),
        totalPages: data.totalPages || 1,
      };
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch bills");
    }
  }
);

export const fetchBillById = createAsyncThunk(
  "bills/fetchBillById",
  async (id: string, { rejectWithValue }) => {
    const res = await fetch(`/api/bills/${id}`);
    const data = await res.json();
    if (!data.success)
      return rejectWithValue(data.error || "Failed to fetch bill");
    return data.data as Bill;
  }
);

export const createBill = createAsyncThunk(
  "bills/createBill",
  async (billData: Partial<Bill>, { rejectWithValue }) => {
    const res = await fetch("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(billData),
    });
    const data = await res.json();
    if (!data.success)
      return rejectWithValue(data.error || "Failed to create bill");
    return data.data as Bill;
  }
);

export const updateBill = createAsyncThunk(
  "bills/updateBill",
  async (
    { id, billData }: { id: string; billData: Partial<Bill> },
    { rejectWithValue }
  ) => {
    const res = await fetch(`/api/bills/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(billData),
    });
    const data = await res.json();
    if (!data.success)
      return rejectWithValue(data.error || "Failed to update bill");
    return data.data as Bill;
  }
);

export const deleteBill = createAsyncThunk(
  "bills/deleteBill",
  async (id: string, { rejectWithValue }) => {
    const res = await fetch(`/api/bills/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!data.success)
      return rejectWithValue(data.error || "Failed to delete bill");
    return id;
  }
);

const billsSlice = createSlice({
  name: "bills",
  initialState,
  reducers: {
    setSelectedBill(state, action: PayloadAction<Bill | null>) {
      state.selectedBill = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBills.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBills.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        // action.payload has { bills, page, limit, total, totalPages }
        state.bills = action.payload.bills || [];
        state.page = action.payload.page || 1;
        state.limit = action.payload.limit || state.limit;
        state.total = action.payload.total || 0;
        state.totalPages = action.payload.totalPages || 1;
      })
      .addCase(fetchBills.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to fetch bills";
      })
      .addCase(fetchBillById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.selectedBill = null;
      })
      .addCase(
        fetchBillById.fulfilled,
        (state, action: PayloadAction<Bill>) => {
          state.loading = false;
          state.selectedBill = action.payload;
        }
      )
      .addCase(fetchBillById.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch bill";
        state.selectedBill = null;
      })
      .addCase(createBill.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBill.fulfilled, (state, action: PayloadAction<Bill>) => {
        state.loading = false;
        state.bills.unshift(action.payload);
      })
      .addCase(createBill.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to create bill";
      })
      .addCase(updateBill.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBill.fulfilled, (state, action: PayloadAction<Bill>) => {
        state.loading = false;
        state.bills = state.bills.map((bill) =>
          (bill._id || bill.id) === (action.payload._id || action.payload.id)
            ? action.payload
            : bill
        );
        if (
          state.selectedBill &&
          (state.selectedBill._id || state.selectedBill.id) ===
            (action.payload._id || action.payload.id)
        ) {
          state.selectedBill = action.payload;
        }
      })
      .addCase(updateBill.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to update bill";
      })
      .addCase(deleteBill.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBill.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        state.bills = state.bills.filter(
          (bill) => (bill._id || bill.id) !== action.payload
        );
        if (
          state.selectedBill &&
          (state.selectedBill._id || state.selectedBill.id) === action.payload
        ) {
          state.selectedBill = null;
        }
      })
      .addCase(deleteBill.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to delete bill";
      });
  },
});

export const { setSelectedBill, clearError } = billsSlice.actions;
export default billsSlice.reducer;

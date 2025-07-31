import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Bill } from "@/types/bill";

interface BillsState {
  bills: Bill[];
  loading: boolean;
  error: string | null;
}

const initialState: BillsState = {
  bills: [],
  loading: false,
  error: null,
};

export const fetchBills = createAsyncThunk("bills/fetchBills", async () => {
  const res = await fetch("/api/bills");
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Failed to fetch bills");
  return data.data as Bill[];
});

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
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBills.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBills.fulfilled, (state, action: PayloadAction<Bill[]>) => {
        state.loading = false;
        state.bills = action.payload;
      })
      .addCase(fetchBills.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch bills";
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
      })
      .addCase(deleteBill.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to delete bill";
      });
  },
});

export default billsSlice.reducer;

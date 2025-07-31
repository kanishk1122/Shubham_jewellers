import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Customer } from "@/types/customer";

interface CustomersState {
  customers: Customer[];
  loading: boolean;
  error: string | null;
}

const initialState: CustomersState = {
  customers: [],
  loading: false,
  error: null,
};

export const fetchCustomers = createAsyncThunk(
  "customers/fetchCustomers",
  async () => {
    const res = await fetch("/api/customers");
    const data = await res.json();
    if (!data.success)
      throw new Error(data.error || "Failed to fetch customers");
    return data.data as Customer[];
  }
);

const customersSlice = createSlice({
  name: "customers",
  initialState,
  reducers: {
    // Add synchronous reducers if needed
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchCustomers.fulfilled,
        (state, action: PayloadAction<Customer[]>) => {
          state.loading = false;
          state.customers = action.payload;
        }
      )
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch customers";
      });
  },
});

export default customersSlice.reducer;

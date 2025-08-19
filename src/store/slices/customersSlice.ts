import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { apiFetch, apiJson } from "@/lib/fetcher";
import type { Customer } from "@/hooks/useCustomers";

interface CustomersState {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  // pagination/meta
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const initialState: CustomersState = {
  customers: [],
  loading: false,
  error: null,
  page: 1,
  limit: 50,
  total: 0,
  totalPages: 1,
};

// params: { search?, page?, limit?, sort? }
export const fetchCustomers = createAsyncThunk(
  "customers/fetchCustomers",
  async (params: Record<string, any> | undefined, { rejectWithValue }) => {
    try {
      let url = "/api/customers";
      if (params && Object.keys(params).length > 0) {
        const qp = new URLSearchParams();
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== null && String(v).length > 0)
            qp.set(k, String(v));
        });
        url += `?${qp.toString()}`;
      }
      const data = await apiJson(url);
      if (!data?.success)
        throw new Error(data?.error || "Failed to fetch customers");
      // normalize payload
      return {
        customers: Array.isArray(data.data) ? data.data : [],
        page: data.page || Number(params?.page) || 1,
        limit: data.limit || Number(params?.limit) || 50,
        total: data.total || 0,
        totalPages: data.totalPages || 1,
      };
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch customers");
    }
  }
);

export const createCustomer = createAsyncThunk(
  "customers/createCustomer",
  async (customerData: Partial<Customer>, { rejectWithValue }) => {
    try {
      const res = await apiFetch("/api/customers", {
        method: "POST",
        body: JSON.stringify(customerData),
      });
      const data = await res.json();
      if (!res.ok)
        return rejectWithValue(data?.error || "Failed to create customer");
      return data.data as Customer;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to create customer");
    }
  }
);

export const updateCustomer = createAsyncThunk(
  "customers/updateCustomer",
  async (
    { id, customerData }: { id: string; customerData: Partial<Customer> },
    { rejectWithValue }
  ) => {
    try {
      const res = await apiFetch(`/api/customers/${id}`, {
        method: "PUT",
        body: JSON.stringify(customerData),
      });
      const data = await res.json();
      if (!res.ok)
        return rejectWithValue(data?.error || "Failed to update customer");
      return data.data as Customer;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to update customer");
    }
  }
);

export const deleteCustomer = createAsyncThunk(
  "customers/deleteCustomer",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await apiFetch(`/api/customers/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok)
        return rejectWithValue(data?.error || "Failed to delete customer");
      return id;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to delete customer");
    }
  }
);

const customersSlice = createSlice({
  name: "customers",
  initialState,
  reducers: {
    clearCustomers(state) {
      state.customers = [];
      state.page = 1;
      state.limit = 50;
      state.total = 0;
      state.totalPages = 1;
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchCustomers
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchCustomers.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.customers = action.payload.customers || [];
          state.page = action.payload.page || 1;
          state.limit = action.payload.limit || state.limit;
          state.total = action.payload.total || 0;
          state.totalPages = action.payload.totalPages || 1;
        }
      )
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to fetch customers";
      })

      // createCustomer
      .addCase(createCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createCustomer.fulfilled,
        (state, action: PayloadAction<Customer>) => {
          state.loading = false;
          // prepend new customer
          state.customers.unshift(action.payload);
          state.total = (state.total || 0) + 1;
        }
      )
      .addCase(createCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to create customer";
      })

      // updateCustomer
      .addCase(updateCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateCustomer.fulfilled,
        (state, action: PayloadAction<Customer>) => {
          state.loading = false;
          state.customers = state.customers.map((c) =>
            (c._id || c.id) === (action.payload._id || action.payload.id)
              ? action.payload
              : c
          );
        }
      )
      .addCase(updateCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to update customer";
      })

      // deleteCustomer
      .addCase(deleteCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteCustomer.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.customers = state.customers.filter(
            (c) => (c._id || c.id) !== action.payload
          );
          state.total = Math.max(0, (state.total || 0) - 1);
        }
      )
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to delete customer";
      });
  },
});

export const { clearCustomers, clearError } = customersSlice.actions;
export default customersSlice.reducer;
export const selectCustomers = (state: { customers: CustomersState }) =>
  state.customers.customers;

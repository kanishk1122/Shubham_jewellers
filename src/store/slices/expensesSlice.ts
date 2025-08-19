import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { apiFetch, apiJson } from "@/lib/fetcher";
import type { Expense } from "@/types/expense";

interface ExpensesState {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const initialState: ExpensesState = {
  expenses: [],
  loading: false,
  error: null,
  page: 1,
  limit: 100,
  total: 0,
  totalPages: 1,
};

export const fetchExpenses = createAsyncThunk(
  "expenses/fetchExpenses",
  async (params: Record<string, any> | undefined, { rejectWithValue }) => {
    try {
      let url = "/api/expenses";
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
        throw new Error(data?.error || "Failed to fetch expenses");
      return {
        expenses: Array.isArray(data.data) ? data.data : [],
        page: data.page || Number(params?.page) || 1,
        limit: data.limit || Number(params?.limit) || 100,
        total: data.total || 0,
        totalPages: data.totalPages || 1,
      };
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch expenses");
    }
  }
);

export const createExpense = createAsyncThunk(
  "expenses/createExpense",
  async (payload: Partial<Expense>, { rejectWithValue }) => {
    try {
      const res = await apiFetch("/api/expenses", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok)
        return rejectWithValue(data?.error || "Failed to create expense");
      return data.data as Expense;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to create expense");
    }
  }
);

// update/delete can be added later similarly if needed.

const expensesSlice = createSlice({
  name: "expenses",
  initialState,
  reducers: {
    clearExpenses(state) {
      state.expenses = [];
      state.page = 1;
      state.limit = 100;
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
      .addCase(fetchExpenses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpenses.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.expenses = action.payload.expenses || [];
        state.page = action.payload.page || 1;
        state.limit = action.payload.limit || state.limit;
        state.total = action.payload.total || 0;
        state.totalPages = action.payload.totalPages || 1;
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to fetch expenses";
      })

      .addCase(createExpense.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createExpense.fulfilled,
        (state, action: PayloadAction<Expense>) => {
          state.loading = false;
          state.expenses.unshift(action.payload);
          state.total = (state.total || 0) + 1;
        }
      )
      .addCase(createExpense.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to create expense";
      });
  },
});

export const { clearExpenses, clearError } = expensesSlice.actions;
export default expensesSlice.reducer;
export const selectExpenses = (state: { expenses: ExpensesState }) =>
  state.expenses.expenses;

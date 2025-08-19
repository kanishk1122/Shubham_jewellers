import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { apiFetch, apiJson } from "@/lib/fetcher";

interface BulkProduct {
  _id?: string;
  id?: string;
  name: string;
  slug?: string;
  category?: string;
  metal?: string;
  purity?: string;
  totalWeight?: number;
  remainingWeight?: number;
  packageWeight?: number;
  makingCharges?: number;
  supplier?: string;
  purchaseDate?: string;
  batchNumber?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  [k: string]: any;
}

interface BulkState {
  bulkProducts: BulkProduct[];
  loading: boolean;
  error: string | null;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const initialState: BulkState = {
  bulkProducts: [],
  loading: false,
  error: null,
  page: 1,
  limit: 100,
  total: 0,
  totalPages: 1,
};

export const fetchBulkProducts = createAsyncThunk(
  "bulkProducts/fetchBulkProducts",
  async (params: Record<string, any> | undefined, { rejectWithValue }) => {
    try {
      let url = "/api/bulk-products";
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
        throw new Error(data?.error || "Failed to fetch bulk products");
      return {
        bulkProducts: Array.isArray(data.data) ? data.data : [],
        page: data.page || Number(params?.page) || 1,
        limit: data.limit || Number(params?.limit) || 100,
        total: data.total || 0,
        totalPages: data.totalPages || 1,
      };
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch bulk products");
    }
  }
);

export const createBulkProduct = createAsyncThunk(
  "bulkProducts/createBulkProduct",
  async (payload: Partial<BulkProduct>, { rejectWithValue }) => {
    try {
      const res = await apiFetch("/api/bulk-products", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok)
        return rejectWithValue(data?.error || "Failed to create bulk product");
      return data.data as BulkProduct;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to create bulk product");
    }
  }
);

export const updateBulkProduct = createAsyncThunk(
  "bulkProducts/updateBulkProduct",
  async (
    {
      id,
      bulkProductData,
    }: { id: string; bulkProductData: Partial<BulkProduct> },
    { rejectWithValue }
  ) => {
    try {
      const res = await apiFetch(`/api/bulk-products/${id}`, {
        method: "PUT",
        body: JSON.stringify(bulkProductData),
      });
      const data = await res.json();
      if (!res.ok)
        return rejectWithValue(data?.error || "Failed to update bulk product");
      return data.data as BulkProduct;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to update bulk product");
    }
  }
);

export const deleteBulkProduct = createAsyncThunk(
  "bulkProducts/deleteBulkProduct",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await apiFetch(`/api/bulk-products/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok)
        return rejectWithValue(data?.error || "Failed to delete bulk product");
      return id;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to delete bulk product");
    }
  }
);

const bulkProductsSlice = createSlice({
  name: "bulkProducts",
  initialState,
  reducers: {
    clearBulk(state) {
      state.bulkProducts = [];
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
      .addCase(fetchBulkProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchBulkProducts.fulfilled,
        (state, action: PayloadAction<any>) => {
          state.loading = false;
          state.bulkProducts = action.payload.bulkProducts || [];
          state.page = action.payload.page || 1;
          state.limit = action.payload.limit || state.limit;
          state.total = action.payload.total || 0;
          state.totalPages = action.payload.totalPages || 1;
        }
      )
      .addCase(fetchBulkProducts.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to fetch bulk products";
      })

      .addCase(createBulkProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createBulkProduct.fulfilled,
        (state, action: PayloadAction<BulkProduct>) => {
          state.loading = false;
          state.bulkProducts.unshift(action.payload);
          state.total = (state.total || 0) + 1;
        }
      )
      .addCase(createBulkProduct.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to create bulk product";
      })

      .addCase(updateBulkProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateBulkProduct.fulfilled,
        (state, action: PayloadAction<BulkProduct>) => {
          state.loading = false;
          state.bulkProducts = state.bulkProducts.map((b) =>
            (b._id || b.id) === (action.payload._id || action.payload.id)
              ? action.payload
              : b
          );
        }
      )
      .addCase(updateBulkProduct.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to update bulk product";
      })

      .addCase(deleteBulkProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteBulkProduct.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.bulkProducts = state.bulkProducts.filter(
            (b) => (b._id || b.id) !== action.payload
          );
          state.total = Math.max(0, (state.total || 0) - 1);
        }
      )
      .addCase(deleteBulkProduct.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to delete bulk product";
      });
  },
});

export const { clearBulk, clearError: clearBulkError } =
  bulkProductsSlice.actions;
export default bulkProductsSlice.reducer;
export const selectBulkProducts = (state: { bulkProducts: BulkState }) =>
  state.bulkProducts.bulkProducts;

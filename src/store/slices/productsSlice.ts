import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { apiFetch, apiJson } from "@/lib/fetcher";
import type { Product } from "@/types/product";

interface ProductsState {
  products: Product[];
  loading: boolean;
  error: string | null;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const initialState: ProductsState = {
  products: [],
  loading: false,
  error: null,
  page: 1,
  limit: 100,
  total: 0,
  totalPages: 1,
};

// params optional: { search?, page?, limit?, sort? }
export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (params: Record<string, any> | undefined, { rejectWithValue }) => {
    try {
      let url = "/api/products";
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
        throw new Error(data?.error || "Failed to fetch products");
      return {
        products: Array.isArray(data.data) ? data.data : [],
        page: data.page || Number(params?.page) || 1,
        limit: data.limit || Number(params?.limit) || 100,
        total: data.total || 0,
        totalPages: data.totalPages || 1,
      };
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch products");
    }
  }
);

export const createProduct = createAsyncThunk(
  "products/createProduct",
  async (productData: Partial<Product>, { rejectWithValue }) => {
    try {
      const res = await apiFetch("/api/products", {
        method: "POST",
        body: JSON.stringify(productData),
      });
      const data = await res.json();
      if (!res.ok)
        return rejectWithValue(data?.error || "Failed to create product");
      return data.data as Product;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to create product");
    }
  }
);

export const updateProduct = createAsyncThunk(
  "products/updateProduct",
  async (
    { id, productData }: { id: string; productData: Partial<Product> },
    { rejectWithValue }
  ) => {
    try {
      const res = await apiFetch(`/api/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(productData),
      });
      const data = await res.json();
      if (!res.ok)
        return rejectWithValue(data?.error || "Failed to update product");
      return data.data as Product;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to update product");
    }
  }
);

export const deleteProduct = createAsyncThunk(
  "products/deleteProduct",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await apiFetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok)
        return rejectWithValue(data?.error || "Failed to delete product");
      return id;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to delete product");
    }
  }
);

const productsSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    clearProducts(state) {
      state.products = [];
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
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.products = action.payload.products || [];
        state.page = action.payload.page || 1;
        state.limit = action.payload.limit || state.limit;
        state.total = action.payload.total || 0;
        state.totalPages = action.payload.totalPages || 1;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to fetch products";
      })

      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createProduct.fulfilled,
        (state, action: PayloadAction<Product>) => {
          state.loading = false;
          state.products.unshift(action.payload);
          state.total = (state.total || 0) + 1;
        }
      )
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to create product";
      })

      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateProduct.fulfilled,
        (state, action: PayloadAction<Product>) => {
          state.loading = false;
          state.products = state.products.map((p) =>
            (p._id || p.id) === (action.payload._id || action.payload.id)
              ? action.payload
              : p
          );
        }
      )
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to update product";
      })

      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteProduct.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.products = state.products.filter(
            (p) => (p._id || p.id) !== action.payload
          );
          state.total = Math.max(0, (state.total || 0) - 1);
        }
      )
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to delete product";
      });
  },
});

export const { clearProducts, clearError } = productsSlice.actions;
export default productsSlice.reducer;

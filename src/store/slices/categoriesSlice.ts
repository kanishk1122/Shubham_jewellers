import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { apiFetch, apiJson } from "@/lib/fetcher";

interface Category {
  _id?: string;
  id?: string;
  name: string;
  slug?: string;
  icon?: string;
  color?: string;
  description?: string;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
  [k: string]: any;
}

interface CategoriesState {
  categories: Category[];
  loading: boolean;
  error: string | null;
}

const initialState: CategoriesState = {
  categories: [],
  loading: false,
  error: null,
};

export const fetchCategories = createAsyncThunk(
  "categories/fetchCategories",
  async (_params: any = undefined, { rejectWithValue }) => {
    try {
      const data = await apiJson("/api/categories");
      if (!data?.success)
        throw new Error(data?.error || "Failed to fetch categories");
      return Array.isArray(data.data) ? data.data : [];
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to fetch categories");
    }
  }
);

export const createCategory = createAsyncThunk(
  "categories/createCategory",
  async (categoryData: Partial<Category>, { rejectWithValue }) => {
    try {
      const res = await apiFetch("/api/categories", {
        method: "POST",
        body: JSON.stringify(categoryData),
      });
      const data = await res.json();
      if (!res.ok)
        return rejectWithValue(data?.error || "Failed to create category");
      return data.data as Category;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to create category");
    }
  }
);

export const updateCategory = createAsyncThunk(
  "categories/updateCategory",
  async (
    { id, categoryData }: { id: string; categoryData: Partial<Category> },
    { rejectWithValue }
  ) => {
    try {
      const res = await apiFetch(`/api/categories/${id}`, {
        method: "PUT",
        body: JSON.stringify(categoryData),
      });
      const data = await res.json();
      if (!res.ok)
        return rejectWithValue(data?.error || "Failed to update category");
      return data.data as Category;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to update category");
    }
  }
);

export const deleteCategory = createAsyncThunk(
  "categories/deleteCategory",
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await apiFetch(`/api/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok)
        return rejectWithValue(data?.error || "Failed to delete category");
      return id;
    } catch (err: any) {
      return rejectWithValue(err.message || "Failed to delete category");
    }
  }
);

const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {
    clearCategories(state) {
      state.categories = [];
      state.error = null;
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchCategories.fulfilled,
        (state, action: PayloadAction<Category[]>) => {
          state.loading = false;
          state.categories = action.payload;
        }
      )
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to fetch categories";
      })

      .addCase(createCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createCategory.fulfilled,
        (state, action: PayloadAction<Category>) => {
          state.loading = false;
          state.categories.unshift(action.payload);
        }
      )
      .addCase(createCategory.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to create category";
      })

      .addCase(updateCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateCategory.fulfilled,
        (state, action: PayloadAction<Category>) => {
          state.loading = false;
          state.categories = state.categories.map((c) =>
            (c._id || c.id) === (action.payload._id || action.payload.id)
              ? action.payload
              : c
          );
        }
      )
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to update category";
      })

      .addCase(deleteCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteCategory.fulfilled,
        (state, action: PayloadAction<string>) => {
          state.loading = false;
          state.categories = state.categories.filter(
            (c) => (c._id || c.id) !== action.payload
          );
        }
      )
      .addCase(deleteCategory.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to delete category";
      });
  },
});

export const { clearCategories, clearError: clearCategoriesError } =
  categoriesSlice.actions;
export default categoriesSlice.reducer;
export const selectCategories = (state: { categories: CategoriesState }) =>
  state.categories.categories;

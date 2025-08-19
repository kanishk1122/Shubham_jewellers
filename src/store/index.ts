import { configureStore } from "@reduxjs/toolkit";
import customersReducer from "./slices/customersSlice";
import productsReducer from "./slices/productsSlice";
import billsReducer from "./slices/billsSlice";
import bulkProductsReducer from "./slices/bulkProductsSlice";
import categoriesReducer from "./slices/categoriesSlice";
import expensesReducer from "./slices/expensesSlice";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";

export const store = configureStore({
  reducer: {
    customers: customersReducer,
    products: productsReducer,
    bills: billsReducer,
    bulkProducts: bulkProductsReducer,
    categories: categoriesReducer,
    expenses: expensesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

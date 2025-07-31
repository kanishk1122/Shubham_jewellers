import { configureStore } from "@reduxjs/toolkit";
import customersReducer from "./slices/customersSlice";
import productsReducer from "./slices/productsSlice";
import billsReducer from "./slices/billsSlice";
import { useDispatch, useSelector, TypedUseSelectorHook } from "react-redux";


export const store = configureStore({
  reducer: {
    customers: customersReducer,
    products: productsReducer,
    bills: billsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

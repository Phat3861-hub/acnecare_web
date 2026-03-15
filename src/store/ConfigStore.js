import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slice/UserSlice";
import categoryReducer from "./slice/CategorySlice";
import productReducer from "./slice/ProductSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    category: categoryReducer,
    product: productReducer,
  },
});

import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slice/UserSlice"; // Import cái slice chúng ta vừa tạo

export const store = configureStore({
  reducer: {
    user: userReducer,
  },
});

import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userInfo: JSON.parse(localStorage.getItem("userInfo")) || null,
  accessToken: localStorage.getItem("accessToken") || null,
  refreshToken: localStorage.getItem("refreshToken") || null, // Thêm dòng này
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, accessToken, refreshToken } = action.payload;
      state.userInfo = user;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;

      localStorage.setItem("userInfo", JSON.stringify(user));
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken); // Lưu thêm refresh token
    },
    logout: (state) => {
      state.userInfo = null;
      state.accessToken = null;
      state.refreshToken = null;
      localStorage.removeItem("userInfo");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    },
  },
});

export const { setCredentials, logout } = userSlice.actions;
export default userSlice.reducer;

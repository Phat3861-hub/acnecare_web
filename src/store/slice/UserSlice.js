import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "../../services/AuthService";

export const logoutUser = createAsyncThunk(
  "user/logoutUser",
  async (_, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const { accessToken, refreshToken } = state.user;

      await authService.logout({
        accessToken: accessToken,
        refreshToken: refreshToken,
      });

      return true;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data);
    }
  },
);

const initialState = {
  userInfo: JSON.parse(localStorage.getItem("userInfo")) || null,
  accessToken: localStorage.getItem("accessToken") || null,
  refreshToken: localStorage.getItem("refreshToken") || null,
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
      localStorage.setItem("refreshToken", refreshToken);
    },
    localLogout: (state) => {
      state.userInfo = null;
      state.accessToken = null;
      state.refreshToken = null;
      localStorage.removeItem("userInfo");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.userInfo = null;
        state.accessToken = null;
        state.refreshToken = null;
        localStorage.removeItem("userInfo");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      })
      .addCase(logoutUser.rejected, (state) => {
        state.userInfo = null;
        state.accessToken = null;
        state.refreshToken = null;
        localStorage.removeItem("userInfo");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      });
  },
});

export const { setCredentials, localLogout } = userSlice.actions;
export default userSlice.reducer;

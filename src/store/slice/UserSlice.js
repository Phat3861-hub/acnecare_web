import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "../../services/AuthService";

export const logoutUser = createAsyncThunk(
  "user/logoutUser",
  async (_, thunkAPI) => {
    try {
      // Gọi API logout, Backend sẽ tự động xóa Cookie
      await authService.logout({});
      return true;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data);
    }
  },
);

const initialState = {
  userInfo: JSON.parse(localStorage.getItem("userInfo")) || null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user } = action.payload;
      state.userInfo = user;
      localStorage.setItem("userInfo", JSON.stringify(user));
    },
    localLogout: (state) => {
      state.userInfo = null;
      localStorage.removeItem("userInfo");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(logoutUser.fulfilled, (state) => {
        state.userInfo = null;
        localStorage.removeItem("userInfo");
      })
      .addCase(logoutUser.rejected, (state) => {
        state.userInfo = null;
        localStorage.removeItem("userInfo");
      });
  },
});

export const { setCredentials, localLogout } = userSlice.actions;
export default userSlice.reducer;

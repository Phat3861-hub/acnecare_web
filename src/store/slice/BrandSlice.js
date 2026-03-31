import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { brandService } from "../../services/BrandService";

export const fetchMyBrandProfile = createAsyncThunk(
  "brand/fetchMyProfile",
  async (_, thunkAPI) => {
    try {
      const res = await brandService.getMyProfile();
      return res.data.result;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || "Lỗi lấy thông tin brand",
      );
    }
  },
);

const brandSlice = createSlice({
  name: "brand",
  initialState: {
    profile: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyBrandProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyBrandProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchMyBrandProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default brandSlice.reducer;

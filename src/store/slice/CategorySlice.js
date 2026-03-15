import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { categoryService } from "../../services/CategoryService";

export const fetchCategories = createAsyncThunk(
  "category/fetchCategories",
  async (_, thunkAPI) => {
    try {
      const res = await categoryService.getAllCategories();
      return res.data.result;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || "Lỗi lấy danh mục",
      );
    }
  },
);

const categorySlice = createSlice({
  name: "category",
  initialState: {
    categories: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default categorySlice.reducer;

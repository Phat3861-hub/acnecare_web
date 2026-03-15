import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { http } from "../../api/config";

// Async thunk để gọi API lấy danh sách bác sĩ ACTIVE
export const fetchActiveDoctors = createAsyncThunk(
  "doctor/fetchActive",
  async (_, thunkAPI) => {
    try {
      const response = await http.get("/users/doctors/active");
      return response.data.result; // Trả về mảng bác sĩ
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  },
);

const doctorSlice = createSlice({
  name: "doctor",
  initialState: {
    activeDoctors: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchActiveDoctors.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchActiveDoctors.fulfilled, (state, action) => {
        state.loading = false;
        state.activeDoctors = action.payload;
      })
      .addCase(fetchActiveDoctors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default doctorSlice.reducer;

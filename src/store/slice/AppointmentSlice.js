import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { http } from "../../api/config";

// Gửi request đặt lịch lên server
export const createAppointment = createAsyncThunk(
  "appointment/create",
  async (appointmentData, thunkAPI) => {
    try {
      const response = await http.post("/appointments", appointmentData);
      return response.data.result;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  },
);

const appointmentSlice = createSlice({
  name: "appointment",
  initialState: {
    currentAppointment: null, // Thông tin lịch đang đặt
    loading: false,
    success: false,
    error: null,
  },
  reducers: {
    resetAppointmentState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.currentAppointment = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createAppointment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createAppointment.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.currentAppointment = action.payload; // Lưu kết quả trả về
      })
      .addCase(createAppointment.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      });
  },
});

export const { resetAppointmentState } = appointmentSlice.actions;
export default appointmentSlice.reducer;

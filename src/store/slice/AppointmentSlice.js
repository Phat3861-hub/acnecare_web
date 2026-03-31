import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { appointmentService } from "../../services/AppointmentService"; // Import đúng tên biến

export const createAppointment = createAsyncThunk(
  "appointment/create",
  async (appointmentData, thunkAPI) => {
    try {
      // Bóc tách .data.result ở đây
      const response =
        await appointmentService.createAppointment(appointmentData);
      return response.data.result;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  },
);
// Lấy lịch sử khám của mình
export const fetchMyHistory = createAsyncThunk(
  "appointment/fetchHistory",
  async (_, thunkAPI) => {
    try {
      const response = await appointmentService.getMyHistory();
      return response.data.result;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  },
);

// Lấy chi tiết 1 lịch khám
export const fetchAppointmentDetail = createAsyncThunk(
  "appointment/fetchDetail",
  async (id, thunkAPI) => {
    try {
      const response = await appointmentService.getAppointmentById(id);
      return response.data.result;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  },
);
// Hủy lịch khám
export const cancelMyAppointment = createAsyncThunk(
  "appointment/cancel",
  async (id, thunkAPI) => {
    try {
      const response = await appointmentService.cancelAppointment(id);
      return response.data.result; // Trả về thông tin lịch vừa bị hủy
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  },
);
// Bác sĩ lấy lịch làm việc của mình
export const fetchDoctorSchedule = createAsyncThunk(
  "appointment/fetchDoctorSchedule",
  async (_, thunkAPI) => {
    try {
      const response = await appointmentService.getDoctorSchedule();
      return response.data.result;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  },
);

export const updateStatus = createAsyncThunk(
  "appointment/updateStatus",
  async ({ id, status, meetingUrl }, thunkAPI) => {
    try {
      const response = await appointmentService.updateAppointmentStatus(id, {
        status,
        meetingUrl,
      });
      return response.data.result;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  },
);

export const submitReview = createAsyncThunk(
  "appointment/submitReview",
  async ({ id, rating, review }, thunkAPI) => {
    try {
      const response = await appointmentService.reviewAppointment(id, {
        rating,
        review,
      });
      return response.data.result;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  },
);
const appointmentSlice = createSlice({
  name: "appointment",
  initialState: {
    currentAppointment: null,
    historyList: [],
    appointmentDetail: null,
    doctorScheduleList: [],
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
    clearDetailState: (state) => {
      state.appointmentDetail = null;
    },
    updateAppointmentLocally: (state, action) => {
      const updatedAppt = action.payload;

      const index = state.historyList.findIndex(
        (item) => item.id === updatedAppt.id,
      );
      if (index !== -1) {
        state.historyList[index] = updatedAppt;
      }

      if (
        state.appointmentDetail &&
        state.appointmentDetail.id === updatedAppt.id
      ) {
        state.appointmentDetail = updatedAppt;
      }
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
        state.currentAppointment = action.payload;
      })
      .addCase(createAppointment.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      });
    builder
      .addCase(fetchMyHistory.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.historyList = action.payload;
      })
      .addCase(fetchMyHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
    builder
      .addCase(fetchAppointmentDetail.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAppointmentDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.appointmentDetail = action.payload;
      })
      .addCase(fetchAppointmentDetail.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
    builder.addCase(cancelMyAppointment.fulfilled, (state, action) => {
      const index = state.historyList.findIndex(
        (item) => item.id === action.payload.id,
      );
      if (index !== -1) {
        state.historyList[index] = action.payload;
      }

      if (
        state.appointmentDetail &&
        state.appointmentDetail.id === action.payload.id
      ) {
        state.appointmentDetail = action.payload;
      }
    });
    builder
      .addCase(fetchDoctorSchedule.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDoctorSchedule.fulfilled, (state, action) => {
        state.loading = false;
        state.doctorScheduleList = action.payload;
      })
      .addCase(fetchDoctorSchedule.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder.addCase(updateStatus.fulfilled, (state, action) => {
      if (state.doctorScheduleList) {
        const index = state.doctorScheduleList.findIndex(
          (item) => item.id === action.payload.id,
        );
        if (index !== -1) {
          state.doctorScheduleList[index] = action.payload;
        }
      }
    });
    builder.addCase(submitReview.fulfilled, (state, action) => {
      // Cập nhật lại list lịch sử và chi tiết
      const index = state.historyList.findIndex(
        (item) => item.id === action.payload.id,
      );
      if (index !== -1) {
        state.historyList[index] = action.payload;
      }
      if (
        state.appointmentDetail &&
        state.appointmentDetail.id === action.payload.id
      ) {
        state.appointmentDetail = action.payload;
      }
    });
  },
});

export const {
  resetAppointmentState,
  clearDetailState,
  updateAppointmentLocally,
} = appointmentSlice.actions;

export default appointmentSlice.reducer;

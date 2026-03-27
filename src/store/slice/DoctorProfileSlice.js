import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { DoctorProfileService } from "../../services/DoctorProfileService";

export const fetchDoctorProfile = createAsyncThunk(
  "doctorProfile/fetchDoctorProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await DoctorProfileService.getMyProfile();
      return response.data.result;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi khi tải hồ sơ",
      );
    }
  },
);

export const updateDoctorProfile = createAsyncThunk(
  "doctorProfile/updateDoctorProfile",
  async (data, { rejectWithValue }) => {
    try {
      const response = await DoctorProfileService.updateMyProfile(data);
      return response.data.result;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Lỗi khi cập nhật hồ sơ",
      );
    }
  },
);

const doctorProfileSlice = createSlice({
  name: "doctorProfile",
  initialState: {
    profile: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Profile
      .addCase(fetchDoctorProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDoctorProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchDoctorProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update Profile
      .addCase(updateDoctorProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateDoctorProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload; // Cập nhật lại state với data mới
      })
      .addCase(updateDoctorProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default doctorProfileSlice.reducer;

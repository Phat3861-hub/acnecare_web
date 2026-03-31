import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { patientService } from "../../services/PatientService";

// Thunk lấy thông tin profile
export const fetchMyPatientProfile = createAsyncThunk(
  "patientProfile/fetchMyProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await patientService.getMyPatientProfile();
      return response.data.result;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Lỗi tải hồ sơ");
    }
  },
);

// Thunk cập nhật profile
export const updateMyPatientProfile = createAsyncThunk(
  "patientProfile/updateMyProfile",
  async (data, { rejectWithValue }) => {
    try {
      const response = await patientService.updateMyPatientProfile(data);
      return response.data.result;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Lỗi cập nhật");
    }
  },
);

const patientProfileSlice = createSlice({
  name: "patientProfile",
  initialState: {
    profile: null,
    isLoading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Profile
      .addCase(fetchMyPatientProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyPatientProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(fetchMyPatientProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Update Profile
      .addCase(updateMyPatientProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateMyPatientProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
      })
      .addCase(updateMyPatientProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export default patientProfileSlice.reducer;

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { ConsultationService } from "../../services/ConsultationService";

export const fetchConsultationServices = createAsyncThunk(
  "consultation/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await ConsultationService.getMyServices();
      return response.data.result;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  },
);

const consultationSlice = createSlice({
  name: "consultation",
  initialState: {
    services: [],
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchConsultationServices.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchConsultationServices.fulfilled, (state, action) => {
        state.loading = false;
        state.services = action.payload;
      })
      .addCase(fetchConsultationServices.rejected, (state) => {
        state.loading = false;
      });
  },
});

export default consultationSlice.reducer;

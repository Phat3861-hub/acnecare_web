import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { treatmentCaseService } from "../../services/TreatmentCaseService";

export const fetchMyCases = createAsyncThunk(
  "treatmentCase/fetchMyCases",
  async (_, thunkAPI) => {
    try {
      const res = await treatmentCaseService.getMyCases();
      return res.data.result;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || "Lỗi lấy danh sách hồ sơ",
      );
    }
  },
);

export const fetchCaseById = createAsyncThunk(
  "treatmentCase/fetchCaseById",
  async (id, thunkAPI) => {
    try {
      const res = await treatmentCaseService.getCaseById(id);
      return res.data.result;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || "Lỗi lấy chi tiết hồ sơ",
      );
    }
  },
);
export const fetchCasesForDoctor = createAsyncThunk(
  "treatmentCase/fetchCasesForDoctor",
  async (_, thunkAPI) => {
    try {
      const res = await treatmentCaseService.getCasesForDoctor();
      return res.data.result;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data || "Lỗi lấy danh sách hồ sơ",
      );
    }
  },
);

const treatmentCaseSlice = createSlice({
  name: "treatmentCase",
  initialState: {
    cases: [],
    currentCase: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrentCase: (state) => {
      state.currentCase = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyCases.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMyCases.fulfilled, (state, action) => {
        state.loading = false;
        state.cases = action.payload;
      })
      .addCase(fetchMyCases.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchCaseById.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCaseById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCase = action.payload;
      })
      .addCase(fetchCaseById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    builder
      .addCase(fetchCasesForDoctor.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCasesForDoctor.fulfilled, (state, action) => {
        state.loading = false;
        state.cases = action.payload;
      })
      .addCase(fetchCasesForDoctor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentCase } = treatmentCaseSlice.actions;
export default treatmentCaseSlice.reducer;

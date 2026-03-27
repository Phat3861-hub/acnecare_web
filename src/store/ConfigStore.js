// src/store/index.js
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slice/UserSlice";
import categoryReducer from "./slice/CategorySlice";
import productReducer from "./slice/ProductSlice";
import doctorReducer from "./slice/DoctorSlice";
import appointmentReducer from "./slice/AppointmentSlice";
import consultationReducer from "./slice/ConsultationSlice";
import doctorProfileReducer from "./slice/DoctorProfileSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    category: categoryReducer,
    product: productReducer,
    doctor: doctorReducer,
    appointment: appointmentReducer,
    consultation: consultationReducer,
    doctorProfile: doctorProfileReducer,
  },
});

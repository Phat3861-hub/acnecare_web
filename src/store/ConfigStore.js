// src/store/index.js
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./slice/UserSlice";
import categoryReducer from "./slice/CategorySlice";
import productReducer from "./slice/ProductSlice";
import doctorReducer from "./slice/DoctorSlice";
import appointmentReducer from "./slice/AppointmentSlice";
import consultationReducer from "./slice/ConsultationSlice";
import doctorProfileReducer from "./slice/DoctorProfileSlice";
import postReducer from "./slice/PostSlice";
import brandReducer from "./slice/BrandSlice";
import treatmentCaseReducer from "./slice/TreatmentCaseSlice";
import chatReducer from "./slice/ChatSlice";

export const store = configureStore({
  reducer: {
    user: userReducer,
    category: categoryReducer,
    product: productReducer,
    doctor: doctorReducer,
    appointment: appointmentReducer,
    consultation: consultationReducer,
    doctorProfile: doctorProfileReducer,
    post: postReducer,
    brand: brandReducer,
    treatmentCase: treatmentCaseReducer,
    chat: chatReducer,
  },
});

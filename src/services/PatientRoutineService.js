import { http } from "../api/config";

export const PatientRoutineService = {
  // Lịch trình
  getMyRoutines: () => http.get("/patient-routines"),
  createRoutine: (data) => http.post("/patient-routines", data),
  updateRoutine: (id, data) => http.put(`/patient-routines/${id}`, data),
  deleteRoutine: (id) => http.delete(`/patient-routines/${id}`),

  // Dữ liệu phụ trợ cho giao diện
  getAllProducts: () => http.get("/products"),
  getAllCategories: () => http.get("/categories"),
};

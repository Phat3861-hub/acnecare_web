import { http } from "../api/config";

export const patientService = {
  getMyPatientProfile: () => {
    return http.get("/patients/profile/me");
  },
  updateMyPatientProfile: (data) => {
    return http.put("/patients/profile/me", data);
  },
  getPatientProfileById: (id) => {
    return http.get(`/patients/profile/${id}`);
  },
};

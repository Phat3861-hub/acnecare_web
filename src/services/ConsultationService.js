import { http } from "../api/config";

export const ConsultationService = {
  getMyServices: () => http.get("/consultation-services/me"),
  createService: (data) => http.post("/consultation-services", data),
  updateService: (id, data) => http.put(`/consultation-services/${id}`, data),
  deleteService: (id) => http.delete(`/consultation-services/${id}`),
};

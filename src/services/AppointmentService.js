import { http } from "../api/config";

export const appointmentService = {
  createAppointment: (data) => http.post("/appointments", data),
  getBusyTimes: (doctorId, dateStr) =>
    http.get(`/appointments/doctor/${doctorId}/busy-times?date=${dateStr}`),
  getMyHistory: () => http.get("/appointments/my-patient-history"),
  getAppointmentById: (id) => http.get(`/appointments/${id}`),
  cancelAppointment: (id) => http.put(`/appointments/${id}/cancel`),
  getDoctorSchedule: () => http.get("/appointments/my-doctor-schedule"),
  updateAppointmentStatus: (id, data) =>
    http.put(`/appointments/${id}/status`, data),
  reviewAppointment: (id, data) =>
    http.post(`/appointments/${id}/review`, data),
  getDoctorServices: (doctorId) =>
    http.get(`/consultation-services/doctor/${doctorId}`),
  // Cập nhật lại dòng này:
  getAvailableSchedules: (doctorId, dateStr, serviceId) =>
    http.get(
      `/doctor-schedules/doctor/${doctorId}?date=${dateStr}&serviceId=${serviceId}`,
    ),
};

import { http } from "../api/config";

export const doctorScheduleService = {
  getMySchedules: () => http.get("/doctor-schedules/me"),
  createSchedule: (data) => http.post("/doctor-schedules", data),
  updateSchedule: (id, data) => http.put(`/doctor-schedules/${id}`, data),
  deleteSchedule: (id) => http.delete(`/doctor-schedules/${id}`),

  getMyServices: () => http.get("/consultation-services/me"),
};

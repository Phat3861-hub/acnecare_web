import { http } from "../api/config";

export const userService = {
  getAllUsers: () => {
    return http.get("/users");
  },
  getMyInfo: () => {
    return http.get("/users/me");
  },
  deleteUser: (id) => {
    return http.delete(`/users/${id}`);
  },
  createUser: (data) => {
    return http.post("/users", data);
  },
  changeUserStatus: (id, status) => {
    return http.put(`/users/${id}/status?status=${status}`);
  },
  getUserById: (id) => {
    return http.get(`/users/${id}`);
  },
  changeDoctorProfileStatus: (id, data) => {
    return http.put(`/doctors/profile/${id}/status`, data);
  },
  getActiveDoctors: () => http.get("/users/doctors/active"),
};

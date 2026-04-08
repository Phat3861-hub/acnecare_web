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
  // 🚨 CẬP NHẬT: Ép kiểu Content-Type sang multipart/form-data
  createUser: (data) => {
    return http.post("/users", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
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
  changeBrandProfileStatus: (id, payload) =>
    http.put(`/brands/profile/${id}`, payload),
  updateMyInfo: (data) => {
    return http.put("/users/me", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  changeMyPassword: (payload) => {
    return http.put("/users/me/change-password", payload);
  },
  createMyPassword: (payload) => {
    return http.put("/users/me/create-password", payload);
  },
};

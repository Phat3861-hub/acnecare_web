import { http } from "../api/config";

export const authService = {
  login: (data) => {
    return http.post("/auth/login", data);
  },
  logout: (data) => {
    return http.post("/auth/logout", data);
  },
  register: (data) => {
    return http.post("/users", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
};

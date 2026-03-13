import axios from "axios";

export const http = axios.create({
  baseURL: "http://localhost:8080/api", // Căn chỉnh lại cho đúng path của bạn
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor tự động gắn token
http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    // ĐẢM BẢO: token phải có thật, và không phải là chữ "undefined" hay "null"
    if (token && token !== "undefined" && token !== "null") {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

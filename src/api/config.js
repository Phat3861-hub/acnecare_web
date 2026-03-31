import axios from "axios";
import { message } from "antd";

export const http = axios.create({
  baseURL: "/api/",
  withCredentials: true,
  timeout: 10000,
  headers: {
    "X-Client-Type": "WEB",
    "Content-Type": "application/json",
  },
});

let refreshTokenRequest = null;

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (
        originalRequest.url.includes("/auth/login") ||
        originalRequest.url.includes("/auth/refresh")
      ) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (!refreshTokenRequest) {
        refreshTokenRequest = axios
          .post(
            `${http.defaults.baseURL}/auth/refresh`,
            {},
            {
              withCredentials: true,
              headers: {
                "X-Client-Type": "WEB",
                "Content-Type": "application/json",
              },
            },
          )
          .then((res) => {
            return res;
          })
          .catch((refreshError) => {
            message.error(
              "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!",
            );
            setTimeout(() => {
              window.location.href = "/auth/login";
            }, 1500);

            throw refreshError;
          })
          .finally(() => {
            refreshTokenRequest = null;
          });
      }

      try {
        await refreshTokenRequest;
        return http(originalRequest);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  },
);

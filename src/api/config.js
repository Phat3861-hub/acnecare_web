import axios from "axios";
import { message } from "antd";

// Lấy URL Backend từ biến môi trường do Vite nạp vào lúc Build Docker
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";

export const http = axios.create({
  // SỬA LỖI 1: Gọi thẳng tới domain Backend, bỏ dấu "/" ở cuối
  baseURL: `${BACKEND_URL}/api`, 
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
        // Dùng axios global (không phải 'http') để tránh bị lặp lại interceptor
        refreshTokenRequest = axios
          .post(
            // SỬA LỖI 2: Viết rõ ràng đường dẫn tuyệt đối, không sợ bị double slash
            `${BACKEND_URL}/api/auth/refresh`, 
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
            
            // Lời khuyên: Nếu bạn có lưu thông tin user trong localStorage/sessionStorage
            // thì nên clear nó ở đây trước khi đẩy về trang login.
            // Ví dụ: localStorage.removeItem("userInfo");

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
        // Gọi lại request ban đầu sau khi refresh token thành công
        return http(originalRequest);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  },
);

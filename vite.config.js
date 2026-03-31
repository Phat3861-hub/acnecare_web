import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Thay đổi function này để nhận mode từ Vite
export default defineConfig(({ mode }) => {
  // Load các file .env dựa theo thư mục hiện tại
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          // Truyền biến môi trường vào đây
          target: env.VITE_BACKEND_URL,
          changeOrigin: true,
        },
      },
    },
  };
});

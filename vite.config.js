import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const backendUrl = process.env.VITE_BACKEND_URL || env.VITE_BACKEND_URL;

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true, 
      proxy: {
        "/api": {
          target: backendUrl,
          changeOrigin: true,
          secure: false, 
        },
      },
    },
  };
});

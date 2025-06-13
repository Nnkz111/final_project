import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],  server: {
    port: parseInt(process.env.VITE_PORT || "5173"),
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://localhost:5000",
        rewrite: (path) => path.replace(/^\/api/, "/api"),
        changeOrigin: true,
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  preview: {
    port: 5173,
    host: true,
    strictPort: true,
    allowedHosts: [process.env.VITE_ALLOWED_HOST || ".onrender.com"],
  },
});

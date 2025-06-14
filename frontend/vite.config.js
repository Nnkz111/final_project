import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    port: parseInt(process.env.VITE_PORT || "5173"),
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://localhost:5000",
        rewrite: (path) => path.replace(/^\/api/, ""),
        changeOrigin: true,
        secure: true,
      },
    },
  },
  preview: {
    port: 5173,
    host: true,
    strictPort: true,
  },
  build: {
    sourcemap: true,
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
});

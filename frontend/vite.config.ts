import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@tpm-dev2/result": resolve(__dirname, "src/libs/result/index.mjs"),
      "@tpm-dev2/catalog": resolve(__dirname, "src/libs/catalog/index.mjs"),
    },
  },
});

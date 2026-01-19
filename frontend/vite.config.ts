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
      buffer: "buffer",
    },
  },
  define: {
    global: "globalThis",
  },
  build: {
    // Optimize chunk splitting for better code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "clerk": ["@clerk/clerk-react"],
          "radix-ui": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-tooltip",
          ],
          "query": ["@tanstack/react-query"],
          // Large utility libraries (loaded on-demand via dynamic imports)
          // Note: pdfjs, jszip, file-saver should be dynamically imported
          // They're not included here to keep initial bundle small
        },
      },
    },
    // Target modern browsers for smaller bundles
    target: "esnext",
    // Minify for production
    minify: "esbuild",
    // Generate source maps for production debugging (optional, can remove)
    sourcemap: false,
    // Chunk size warnings threshold (500KB)
    chunkSizeWarningLimit: 500,
  },
});

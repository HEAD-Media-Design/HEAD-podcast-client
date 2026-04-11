import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react-dom/")) return "vendor-react";
          if (id.includes("node_modules/react/")) return "vendor-react";
          if (id.includes("node_modules/react-router")) return "vendor-router";
          if (id.includes("node_modules/p5")) return "vendor-p5";
          if (id.includes("node_modules/zod")) return "vendor-zod";
          if (id.includes("node_modules/opentype.js")) return "vendor-opentype";
        },
      },
    },
  },
});

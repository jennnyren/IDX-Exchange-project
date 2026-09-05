import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test-setup.js",
    coverage: {
      provider: "v8",
      // Only application code is measured; entry points (main.jsx) and the
      // test setup would otherwise dilute the component numbers.
      include: [
        "src/components/**/*.jsx",
        "src/hooks/**/*.js",
        "src/api/**/*.js",
        "src/utils/**/*.js",
      ],
      thresholds: {
        lines: 70,
        statements: 70,
        branches: 70,
        functions: 70,
      },
    },
  },
});

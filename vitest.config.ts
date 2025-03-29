import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@landing-pages": path.resolve(__dirname, "./landing-pages"),
      "@versions": path.resolve(__dirname, "./landing-pages/versions"),
    },
  },
});

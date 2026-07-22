import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
    pool: "forks",
    fileParallelism: false,
    maxWorkers: 1,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/index.ts", "src/**/types/**"],
    },
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});

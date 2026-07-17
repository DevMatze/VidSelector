import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  test: {
    environment: "node",
    exclude: ["tests/e2e/**", "node_modules/**", ".next/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["lib/**/*.ts", "app/api/**/route.ts"],
      exclude: ["**/*.test.ts", "lib/demo-data.ts", "lib/prisma.ts"],
      thresholds: { statements: 30, branches: 25, functions: 30, lines: 30 },
    },
  },
});

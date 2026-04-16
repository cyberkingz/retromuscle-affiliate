import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // server-only is a Next.js bundler guard that throws in client contexts.
      // It is not installed as a real module, so Vitest needs a stub.
      "server-only": path.resolve(__dirname, "./src/__test-utils__/server-only-stub.ts")
    }
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**", "src/domain/**"],
      exclude: ["src/**/*.test.ts"]
    }
  }
});

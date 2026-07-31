import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    server: {
      deps: {
        inline: ["next-auth", "@auth/core", "@auth/prisma-adapter"],
      },
    },
  },
  resolve: {
    alias: { "@": resolve(__dirname, ".") },
  },
});

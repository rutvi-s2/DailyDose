import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    environment: "node",
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

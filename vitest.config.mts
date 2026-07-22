import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";
import { configDefaults } from "vitest/config";
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    exclude: [...configDefaults.exclude, "e2e/**"],
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    server: {
      deps: {
        inline: ["next-intl"],
      },
    },
  },
});

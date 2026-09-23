import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import { buildEnv } from "./src/shared/config/build-env";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // The marker package throws outside a React Server bundle; under test the
      // server modules are exercised directly, which is the point.
      "server-only": fileURLToPath(new URL("./tests/support/empty.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // The same facts `next.config.ts` inlines, so content reads the card here too.
    env: buildEnv(root),
  },
});

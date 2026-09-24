import { fileURLToPath } from "node:url";
import { buildEnv } from "@evinvest/kitstart/next/config";
import { defineConfig } from "vitest/config";

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
    // Through Vite rather than Node, so the alias above reaches kitstart's own
    // `server-only` imports (its `./next` and `./server` entries).
    server: { deps: { inline: [/@evinvest\/kitstart/] } },
    // The same facts `next.config.ts` inlines, so content reads the card here too.
    env: buildEnv(root),
  },
});

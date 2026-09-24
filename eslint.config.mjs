import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Photos are imported statically and served as they are (`images.unoptimized`);
      // `next/image` would add the optimiser for sources already sized for the page.
      "@next/next/no-img-element": "off",
    },
  },
  // `src/shared/landing/server` is what kitstart's `./server` has not replaced
  // yet; it must not reach back into the brand app.
  {
    files: ["src/shared/landing/server/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: ["@/*"], message: "landing server reads only kitstart and its own inputs" }] },
      ],
    },
  },
  globalIgnores([".next/**", "node_modules/**", "next-env.d.ts", "brand_materials/**", "docs/**"]),
]);

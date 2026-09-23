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
  // `src/shared/landing` is the seam a future shared landing package will
  // take whole. Its core is pure — edge- and client-safe — and neither half may
  // reach back into the brand app, or the move stops being mechanical.
  {
    files: ["src/shared/landing/core/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@/*", "../server/*", "../../server/*"], message: "landing core is brand-free and pure" },
            {
              group: ["node:*", "next", "next/*", "react", "react/*", "react-dom", "server-only"],
              message: "landing core runs anywhere",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/shared/landing/server/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: ["@/*"], message: "landing server reads only landing core and its own inputs" }] },
      ],
    },
  },
  globalIgnores([".next/**", "node_modules/**", "next-env.d.ts", "brand_materials/**", "docs/**"]),
]);

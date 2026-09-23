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
  globalIgnores([".next/**", "node_modules/**", "next-env.d.ts", "brand_materials/**", "docs/**"]),
]);

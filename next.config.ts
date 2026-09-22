import type { NextConfig } from "next";
import { buildEnv } from "./src/shared/config/build-env";

const config: NextConfig = {
  poweredByHeader: false,
  // The card's facts, the mark and the OG palette are inlined at build time:
  // the container carries no `assets/`, and a phone number is not read per
  // request.
  env: buildEnv(process.cwd()),
  // Photos are imported statically and served as fingerprinted files; the
  // optimiser would add a native dependency to the image for no emergency
  // visitor's benefit — the sources are already sized for the page.
  images: { unoptimized: true },
  // The OG card sets type in the brand's display face; `ImageResponse` needs
  // the .ttf bytes at runtime, which file tracing cannot infer from a path.
  outputFileTracingIncludes: {
    "/og": ["./assets/fonts/*.ttf"],
  },
};

export default config;

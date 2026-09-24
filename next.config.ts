import type { NextConfig } from "next";
import { buildEnv } from "./src/shared/config/build-env";

const config: NextConfig = {
  poweredByHeader: false,
  // Pages are cached (ISR) and say so: `s-maxage` is the live data's TTL, and
  // this bounds the `stale-while-revalidate` tail a CDN may serve while it
  // refetches — a day, not Next's default year.
  expireTime: 86_400,
  // The image ships `.next/standalone`: the server plus only the files it was
  // traced to need, not the dev toolchain `npm ci` installed to build it.
  output: "standalone",
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
  // The tracer keeps sharp because Next can optimise images; with
  // `unoptimized` it is never loaded, and its prebuilt libvips links against a
  // system loader the Nix image does not have — half the standalone's weight.
  outputFileTracingExcludes: {
    "*": ["node_modules/sharp/**", "node_modules/@img/**"],
  },
  experimental: {
    // The server runs from the read-only Nix store, so the live-data fetch
    // cache stays in memory: per pod, which a restart forgetting costs one
    // round trip, instead of a write the store refuses.
    isrFlushToDisk: false,
    // `app/global-not-found.tsx` answers every path no route matches — the
    // proxy sends dead paths there (see `GONE`). The root layout lives under
    // `[locale]`, so without it that 404 is Next's bare default page.
    globalNotFound: true,
  },
};

export default config;

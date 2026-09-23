import localFont from "next/font/local";

// Self-hosted from `assets/fonts/` — the same cuts the printed card sets, as
// woff2 (the .ttf twins are typst's and the OG card's). No CDN: identical
// offline, and nothing third-party loads before the visitor asks for it.

export const archivo = localFont({
  src: [
    { path: "../../../assets/fonts/Archivo-SemiBold.woff2", weight: "600", style: "normal" },
    { path: "../../../assets/fonts/Archivo-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-archivo",
  display: "swap",
});

export const inter = localFont({
  src: [
    { path: "../../../assets/fonts/Inter-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../../assets/fonts/Inter-Medium.woff2", weight: "500", style: "normal" },
    { path: "../../../assets/fonts/Inter-SemiBold.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
});

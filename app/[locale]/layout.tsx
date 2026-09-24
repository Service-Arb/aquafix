import "../globals.css";
import { loadLocale, metadataBase } from "@evinvest/kitstart/next";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { site } from "@/shared/config/site";
import { archivo, inter } from "@/shared/ui/fonts";

/**
 * The root layout lives under `[locale]` so `<html lang>` is the page's own
 * language on the first byte — both languages are prefixed, so every page has
 * one. The brand scope and the light polarity sit on `<html>`: overlays portal
 * to `body` and stay inside both without a provider.
 */
export const metadata: Metadata = {
  metadataBase: metadataBase(site),
  applicationName: site.brand.name,
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = await loadLocale(site, params);
  return (
    <html lang={locale} data-brand={site.brand.id} className={`light ${archivo.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}

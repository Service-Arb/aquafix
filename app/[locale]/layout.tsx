import "../globals.css";
import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { brandOrigin } from "@/entities/location";
import { BRAND } from "@/shared/config/brand";
import { isLocale } from "@/shared/config/i18n";
import { archivo, inter } from "@/shared/ui/fonts";

/**
 * The root layout lives under `[locale]` so `<html lang>` is the page's own
 * language on the first byte — both languages are prefixed, so every page has
 * one. The brand scope and the light polarity sit on `<html>`: overlays portal
 * to `body` and stay inside both without a provider.
 */
export const metadata: Metadata = {
  metadataBase: new URL(brandOrigin()),
  applicationName: BRAND.name,
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
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html lang={locale} data-brand={BRAND.id} className={`light ${archivo.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}

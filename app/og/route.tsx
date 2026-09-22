import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { copyFor } from "@/entities/content";
import { bakedLocation } from "@/entities/location";
import { BRAND } from "@/shared/config/brand";
import type { OgPalette } from "@/shared/config/build-env";
import { DEFAULT_LOCALE, isLocale } from "@/shared/config/i18n";
import { PAGE_KEYS, type PageKey } from "@/shared/config/routes";

/**
 * The OG card, drawn per request from the same fields the `<head>` reads — so
 * a title changed in the copy cannot leave a stale card behind. Baked data
 * only: a share preview is not worth a round trip to the live source.
 */
export const dynamic = "force-dynamic";

type Palette = OgPalette;

function palette(): Palette {
  const raw: unknown = JSON.parse(process.env.AQUAFIX_OG_PALETTE ?? "null");
  if (typeof raw !== "object" || raw === null) throw new Error("AQUAFIX_OG_PALETTE was not inlined");
  const pick = (k: keyof Palette): string => {
    const v: unknown = Reflect.get(raw, k);
    if (typeof v !== "string") throw new Error(`AQUAFIX_OG_PALETTE.${k} is missing`);
    return v;
  };
  return { background: pick("background"), card: pick("card"), ink: pick("ink"), inkSoft: pick("inkSoft"), primary: pick("primary") };
}

const font = (file: string) => readFile(join(process.cwd(), "assets/fonts", file));

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const lang = url.searchParams.get("lang");
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const location = bakedLocation(url.searchParams.get("l") ?? "");
  const p = url.searchParams.get("p");
  const page: PageKey = PAGE_KEYS.find(k => k === p) ?? "home";
  const copy = copyFor({ locale, place: location?.place[locale] ?? BRAND.name, phone: location?.phone ?? BRAND.phone });
  const title = location ? copy.t.pages[page].title(copy.f) : copy.t.brandPage.h1;
  const c = palette();
  const [display, text] = await Promise.all([font("Archivo-Bold.ttf"), font("Inter-Medium.ttf")]);
  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: 72, background: c.background, color: c.ink }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="52" height="60" viewBox="0 0 86.6 100">
            <path fillRule="evenodd" d={process.env.AQUAFIX_MARK_PATH ?? ""} fill={c.primary} />
          </svg>
          <div style={{ display: "flex", fontFamily: "Archivo", fontSize: 44 }}>
            <span>AQUA</span>
            <span style={{ color: c.primary }}>FIX</span>
          </div>
        </div>
        <div style={{ display: "flex", flex: 1, alignItems: "center", fontFamily: "Archivo", fontSize: 68, lineHeight: 1.08 }}>
          {title}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Inter", fontSize: 28, color: c.inkSoft }}>
          <span>{copy.t.promise}</span>
          <span style={{ color: c.primary }}>{location?.phone ?? BRAND.phone}</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Archivo", data: display, weight: 700, style: "normal" },
        { name: "Inter", data: text, weight: 500, style: "normal" },
      ],
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    },
  );
}

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ogPalette, ogRoute } from "@evinvest/kitstart/next";
import { copyFor } from "@/entities/content";
import { contactOf } from "@/entities/place";
import { CARD, site } from "@/shared/config/site";

/**
 * The OG card, drawn from the same fields the `<head>` reads — so a title
 * changed in the copy cannot leave a stale card behind. Baked data only: a
 * share preview is not worth a round trip to the live source. kitstart
 * normalises the query to the closed set of (point, language, page) and draws
 * each card once per process.
 */
export const dynamic = "force-dynamic";

/** `[colors.dark]` of assets/brand.toml, inlined at build — not a second copy here. */
const c = ogPalette();

const font = (file: string) => readFile(join(process.cwd(), "assets/fonts", file));

export const GET = ogRoute(site, {
  // `withLanding({ ogFiles })` traces the files into the standalone output.
  fonts: async () => {
    const [display, text] = await Promise.all([font("Archivo-Bold.ttf"), font("Inter-Medium.ttf")]);
    return [
      { name: "Archivo", data: display, weight: 700, style: "normal" },
      { name: "Inter", data: text, weight: 500, style: "normal" },
    ];
  },
  draw: ({ locale, place, page }) => {
    const phone = place ? contactOf(place).phone : CARD.phone;
    const copy = copyFor({ locale, place: place?.name[locale] ?? site.brand.name, phone });
    const title = place ? copy.t.pages[page].title(copy.f) : copy.t.brandPage.h1;
    return (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: 72, background: c.background, color: c.ink }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="52" height="60" viewBox="0 0 86.6 100">
            <path fillRule="evenodd" d={process.env.SITE_MARK_PATH ?? ""} fill={c.primary} />
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
          <span style={{ color: c.primary }}>{phone}</span>
        </div>
      </div>
    );
  },
});

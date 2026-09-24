import "./globals.css";
import { headers } from "next/headers";
import { DEFAULT_LOCALE, isLocale } from "@/shared/config/i18n";
import { site } from "@/shared/config/site";
import { GONE_HEADER, parseGoneHeader } from "@/shared/landing/core/routing";
import { archivo, inter } from "@/shared/ui/fonts";
import { Gone } from "@/views/not-found/server";

/**
 * Every path no route matches — among them each dead path the proxy sends
 * here (see `GONE`) — answered 404 with the brand's screen rendered on the
 * server, so a visitor without JavaScript still gets the offer and the phone.
 * A document of its own: the root layout lives under `[locale]`.
 *
 * It reads the proxy's header, which only this route does: it is not a
 * boundary inside the cached pages, so they stay static. The proxy drops a
 * client-sent value everywhere but on its own target, where a forged one can
 * at most pick another real point's phone or the other language; anything
 * unreadable falls back to the brand. Rendered per request (`private, no-store`): nothing a scanner
 * asks for takes a cache entry. No `robots` here: Next already emits
 * `noindex` for a 404.
 */
export default async function GlobalNotFound() {
  const gone = parseGoneHeader((await headers()).get(GONE_HEADER));
  const locale = isLocale(gone.locale) ? gone.locale : DEFAULT_LOCALE;
  return (
    <html lang={locale} data-brand={site.brand.id} className={`light ${archivo.variable} ${inter.variable}`}>
      <body>
        <Gone locale={locale} location={gone.location} />
      </body>
    </html>
  );
}

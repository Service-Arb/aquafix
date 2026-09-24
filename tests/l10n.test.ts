import { createRouting, GONE_HEADER, type RequestFacts } from "@evinvest/kitstart";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { site } from "@/shared/config/site";
import { proxy } from "../proxy";

// Aquafix's own site config through kitstart's routing. kitstart pins the
// decision itself against its shared fixtures (`tests/fixtures/kitstart/
// decide.json`, whose `aquafix` site is a copy of this one); this table holds
// the real config to it, so a page, a slug or a legacy path added here cannot
// route differently from what the fixtures promise.
const { decide, hostSlug } = createRouting(site);

const APEX = "aquafix.top";
const ROYAT = "royat.aquafix.top";

function req(pathname: string, over: Partial<RequestFacts> = {}): RequestFacts {
  const [path = "/", qs = ""] = pathname.split("?");
  return { host: APEX, pathname: path, query: new URLSearchParams(qs), acceptLanguage: null, cookieLang: null, ...over };
}

describe("language negotiation", () => {
  it("sends a header-less visitor (and a crawler) to French, the default", () => {
    expect(decide(req("/"))).toEqual({ kind: "negotiate", location: "/fr" });
  });

  it("honours Accept-Language by q-value", () => {
    expect(decide(req("/", { acceptLanguage: "en-GB,en;q=0.9,fr;q=0.5" }))).toEqual({ kind: "negotiate", location: "/en" });
    expect(decide(req("/", { acceptLanguage: "de,fr-CH;q=0.8,en;q=0.5" }))).toEqual({ kind: "negotiate", location: "/fr" });
    expect(decide(req("/", { acceptLanguage: "ja" }))).toEqual({ kind: "negotiate", location: "/fr" });
  });

  it("lets the cookie outrank the header", () => {
    expect(decide(req("/", { acceptLanguage: "fr", cookieLang: "en" }))).toEqual({ kind: "negotiate", location: "/en" });
    expect(decide(req("/", { cookieLang: "xx" }))).toEqual({ kind: "negotiate", location: "/fr" });
  });

  it("negotiates only page paths — the form target, the sitemap and the OG card pass", () => {
    for (const path of ["/quote", "/sitemap.xml", "/robots.txt", "/og", "/health", "/_next/static/x.js"]) {
      expect(decide(req(path)), path).toEqual({ kind: "pass" });
    }
    expect(decide(req("/health", { host: ROYAT }))).toEqual({ kind: "pass" });
  });

  // Let through, each of these reached `[locale]` and Next cached its
  // `notFound()` as a page: one in-memory ISR entry per scanner probe.
  it.each([
    ["/nope", APEX, {}, { locale: "fr", location: null }],
    ["/nope/nope", APEX, {}, { locale: "fr", location: null }],
    ["/xx/prices", APEX, {}, { locale: "fr", location: null }],
    ["/royat/nope", APEX, {}, { locale: "fr", location: null }],
    ["/nope", ROYAT, {}, { locale: "fr", location: "_royat" }],
    ["/fr/royat/prices/deeper", APEX, {}, { locale: "fr", location: "royat" }],
    ["/en/_royat/prices/deeper", APEX, {}, { locale: "en", location: "_royat" }],
    ["/fr/a/b/c/d", ROYAT, {}, { locale: "fr", location: "_royat" }],
  ] as const)("sends %s on %s to the 404, in its language", (path, host, over, gone) => {
    expect(decide(req(path, { host, ...over }))).toEqual({ kind: "gone", ...gone });
  });

  it("negotiates a point's pages on its subdomain and through the apex", () => {
    expect(decide(req("/prices", { host: ROYAT }))).toEqual({ kind: "negotiate", location: "/fr/prices" });
    expect(decide(req("/royat/prices", { acceptLanguage: "en" }))).toEqual({ kind: "negotiate", location: "/en/royat/prices" });
  });

  it("turns ?lang= into a choice and takes it out of the URL, keeping the rest", () => {
    expect(decide(req("/fr/royat/prices?lang=en&utm_source=gbp"))).toEqual({
      kind: "choose",
      locale: "en",
      location: "/en/royat/prices?utm_source=gbp",
    });
  });
});

describe("the Rust site's URLs", () => {
  it.each([
    ["/prices", "/en"],
    ["/about", "/en"],
    ["/guarantee", "/en"],
    ["/thanks", "/en/thanks"],
    ["/fr/prices", "/fr"],
    ["/fr/about", "/fr"],
    ["/fr/guarantee", "/fr"],
    ["/en/prices", "/en"],
  ])("moves %s on the apex permanently to %s", (from, to) => {
    expect(decide(req(from))).toEqual({ kind: "moved", location: to });
  });

  it("keeps the brand's own thank-you page and a point's own sub-pages", () => {
    expect(decide(req("/fr/thanks"))).toEqual({ kind: "serve", pathname: "/fr/thanks" });
    expect(decide(req("/prices", { host: ROYAT }))).toMatchObject({ kind: "negotiate" });
  });
});

describe("host routing", () => {
  it("reads the point from the subdomain, locally too", () => {
    expect(hostSlug("royat.aquafix.top")).toBe("royat");
    expect(hostSlug("lyon-nord.localhost:3000")).toBe("lyon-nord");
    expect(hostSlug("aquafix.top")).toBeNull();
    expect(hostSlug("www.aquafix.top")).toBeNull();
    expect(hostSlug("evil.aquafix.top")).toBeNull();
  });

  it("serves a subdomain's pages from the point's host-mode route", () => {
    expect(decide(req("/fr", { host: ROYAT }))).toEqual({ kind: "serve", pathname: "/fr/_royat" });
    expect(decide(req("/en/prices", { host: ROYAT }))).toEqual({ kind: "serve", pathname: "/en/_royat/prices" });
  });

  it("sends a dead path to the 404, for the point it belongs to", () => {
    // On a point's host, a dead path is that point's 404.
    expect(decide(req("/fr/nope", { host: ROYAT }))).toEqual({ kind: "gone", locale: "fr", location: "_royat" });
    expect(decide(req("/en/prices/nope", { host: ROYAT }))).toEqual({ kind: "gone", locale: "en", location: "_royat" });
    // Through the apex: a known point's dead page, and an unknown point — the brand's.
    expect(decide(req("/fr/lyon-nord/nope"))).toEqual({ kind: "gone", locale: "fr", location: "lyon-nord" });
    expect(decide(req("/fr/nowhere"))).toEqual({ kind: "gone", locale: "fr", location: null });
    expect(decide(req("/fr/_nowhere/prices"))).toEqual({ kind: "gone", locale: "fr", location: null });
    expect(decide(req("/fr/404"))).toEqual({ kind: "gone", locale: "fr", location: null });
    // Its own target, proxied back in by Next, passes on any host — sent to
    // the 404 again it would loop.
    expect(decide(req("/fr/404/404"))).toEqual({ kind: "serve", pathname: "/fr/404/404" });
    expect(decide(req("/en/404/404", { host: ROYAT }))).toEqual({ kind: "serve", pathname: "/en/404/404" });
  });

  it("keeps every real page out of the 404 route", () => {
    for (const path of ["/fr", "/fr/thanks", "/fr/royat", "/fr/royat/prices", "/fr/royat/thanks", "/fr/_royat/about"]) {
      expect(decide(req(path)).kind, path).toBe("serve");
    }
  });

  it("serves the apex fallback path as it is, in path link mode", () => {
    expect(decide(req("/fr/royat/about"))).toEqual({ kind: "serve", pathname: "/fr/royat/about" });
    expect(decide(req("/en"))).toEqual({ kind: "serve", pathname: "/en" });
  });

  it("passes a host-mode path through untouched — Next re-enters the proxy with it to fill its cache", () => {
    expect(decide(req("/fr/_royat/prices", { host: "localhost:3000" }))).toEqual({ kind: "serve", pathname: "/fr/_royat/prices" });
  });
});

// kitstart passes a path with an extension; this app serves no files, so its
// proxy sends each to the 404 like any dead path. The rest of the proxy is
// kitstart's, tested there (`ts/kitstart/test/next.node.test.ts`, "the proxy").
describe("the proxy on a path with an extension", () => {
  const request = (url: string, headers: Record<string, string> = {}) => new NextRequest(new URL(url), { headers });
  const gone = (res: Response) => ({
    rewrite: new URL(res.headers.get("x-middleware-rewrite") ?? "http://x.invalid/").pathname,
    header: res.headers.get(`x-middleware-request-${GONE_HEADER}`),
  });

  it.each([
    ["https://aquafix.top/wp-login.php", APEX, { "accept-language": "en" }, { rewrite: "/en/404/404", header: "en" }],
    ["https://aquafix.top/.env", APEX, { cookie: "lang=en" }, { rewrite: "/en/404/404", header: "en" }],
    ["https://aquafix.top/favicon.ico", APEX, {}, { rewrite: "/fr/404/404", header: "fr" }],
    ["https://aquafix.top/fr/x.php", APEX, {}, { rewrite: "/fr/404/404", header: "fr" }],
    ["https://royat.aquafix.top/fr/x.php", ROYAT, {}, { rewrite: "/fr/404/404", header: "fr/_royat" }],
    ["https://aquafix.top/fr/royat/x.php", APEX, {}, { rewrite: "/fr/404/404", header: "fr/royat" }],
  ] as const)("sends %s to the 404, in its language, for its point", (url, host, headers, want) => {
    expect(gone(proxy(request(url, { host, ...headers })))).toEqual(want);
  });

  it("lets the metadata routes through", () => {
    for (const path of ["/sitemap.xml", "/robots.txt"]) {
      const res = proxy(request(`https://royat.aquafix.top${path}`, { host: ROYAT }));
      expect(res.headers.get("x-middleware-rewrite"), path).toBeNull();
      expect(res.headers.get("x-middleware-next"), path).toBe("1");
    }
  });
});

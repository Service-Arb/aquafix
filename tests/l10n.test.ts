import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { decide, hostSlug, routeRequest, type RequestFacts } from "@/features/request-routing";
import { LOCATION_MODE_HEADER, ROUTE_HEADER } from "@/shared/config/routes";

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
    for (const path of ["/quote", "/sitemap.xml", "/robots.txt", "/og", "/health", "/_next/static/x.js", "/royat/nope"]) {
      expect(decide(req(path)), path).toEqual({ kind: "pass" });
    }
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
    expect(decide(req("/fr/thanks"))).toEqual({ kind: "serve", pathname: "/fr/thanks", mode: "path" });
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

  it("serves a subdomain's pages from the point's route, in host link mode", () => {
    expect(decide(req("/fr", { host: ROYAT }))).toEqual({ kind: "serve", pathname: "/fr/royat", mode: "host" });
    expect(decide(req("/en/prices", { host: ROYAT }))).toEqual({ kind: "serve", pathname: "/en/royat/prices", mode: "host" });
    // A dead path on a point's host is that point's 404.
    expect(decide(req("/fr/nope", { host: ROYAT }))).toEqual({ kind: "serve", pathname: "/fr/royat/nope", mode: "host" });
  });

  it("serves the apex fallback path as it is, in path link mode", () => {
    expect(decide(req("/fr/royat/about"))).toEqual({ kind: "serve", pathname: "/fr/royat/about", mode: "path" });
    expect(decide(req("/en"))).toEqual({ kind: "serve", pathname: "/en", mode: null });
  });
});

describe("the proxy", () => {
  const request = (url: string, headers: Record<string, string> = {}) => new NextRequest(new URL(url), { headers });

  it("answers the bare URL with a 302 that varies on the language inputs", () => {
    const res = routeRequest(request("https://aquafix.top/"));
    expect(res.status).toBe(302);
    expect(new URL(res.headers.get("location") ?? "").pathname).toBe("/fr");
    expect(res.headers.get("vary")).toContain("Accept-Language");
  });

  it("mints the language cookie for a year on ?lang=", () => {
    const res = routeRequest(request("https://royat.aquafix.top/fr/prices?lang=en", { host: ROYAT }));
    expect(res.status).toBe(303);
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(/^lang=en;/);
    expect(cookie).toContain("Max-Age=31536000");
  });

  it("answers an old apex URL with a 301", () => {
    const res = routeRequest(request("https://aquafix.top/fr/prices"));
    expect(res.status).toBe(301);
    expect(new URL(res.headers.get("location") ?? "").pathname).toBe("/fr");
  });

  it("strips the proxy's own headers on a pass-through path too", () => {
    const res = routeRequest(
      request("https://aquafix.top/quote", { accept: "text/html", [LOCATION_MODE_HEADER]: "host", [ROUTE_HEADER]: "/fr/royat" }),
    );
    const overridden = res.headers.get("x-middleware-override-headers") ?? "";
    expect(overridden.split(",")).toContain("accept");
    expect(overridden.split(",")).not.toContain(LOCATION_MODE_HEADER);
    expect(overridden.split(",")).not.toContain(ROUTE_HEADER);
    expect(res.headers.get(`x-middleware-request-${ROUTE_HEADER}`)).toBeNull();
  });

  it("strips a client-sent link mode before setting its own", () => {
    const res = routeRequest(request("https://royat.aquafix.top/fr", { host: ROYAT, [LOCATION_MODE_HEADER]: "path" }));
    expect(res.headers.get("x-middleware-rewrite")).toContain("/fr/royat");
    expect(res.headers.get(`x-middleware-request-${LOCATION_MODE_HEADER}`)).toBe("host");
  });
});

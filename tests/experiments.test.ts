import { HONEYPOT_FIELD, RENDERED_AT_FIELD, type LeadStore } from "@evinvest/kitstart";
import { quoteRoute } from "@evinvest/kitstart/next";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { experimentLeads } from "@/features/experiments/server";
import { CONTROL, EXPERIMENTS } from "@/shared/config/experiments";
import { site } from "@/shared/config/site";
import { assignedVariants, cookieReader, decodeBucket, encodeBucket, isBot } from "@/shared/lib/experiments";
import { proxy } from "../proxy";

const ROYAT = "royat.aquafix.top";
const PHONE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1";

function visit(url: string, headers: Record<string, string> = {}) {
  const host = new URL(url).host;
  const res = proxy(new NextRequest(new URL(url), { headers: { host, "user-agent": PHONE_UA, ...headers } }));
  return {
    rewrite: res.headers.get("x-middleware-rewrite") ? new URL(res.headers.get("x-middleware-rewrite") ?? "").pathname : null,
    cookies: res.headers.getSetCookie().map(c => c.split(";")[0] ?? ""),
  };
}

describe("the variant bucket in the path", () => {
  it("round-trips every non-control assignment and keeps the control's plain URL", () => {
    expect(encodeBucket(CONTROL)).toBeNull();
    for (const hero of ["a", "b"] as const) {
      for (const quote of ["a", "b"] as const) {
        const assignment = { hero_call_first: hero, quote_price_anchor: quote };
        const bucket = encodeBucket(assignment);
        if (bucket) expect(decodeBucket(bucket)).toEqual(assignment);
      }
    }
  });

  it("refuses a bucket the proxy never writes", () => {
    for (const junk of ["aa", "zz", "b", "bbb", "~ab", "", "Bb"]) expect(decodeBucket(junk), junk).toBeNull();
  });

  it("declares one-letter variants with `a` first, which the path encoding needs", () => {
    for (const spec of Object.values(EXPERIMENTS)) {
      expect(spec.variants[0]).toBe("a");
      for (const v of spec.variants) expect(v).toMatch(/^[a-z]$/);
    }
  });
});

describe("bots", () => {
  it.each(["Googlebot/2.1 (+http://www.google.com/bot.html)", "Mozilla/5.0 (compatible; bingbot/2.0)", "AdsBot-Google (+http://www.google.com/adsbot.html)", "facebookexternalhit/1.1", "Mozilla/5.0 (Linux) Chrome-Lighthouse", "", "some-crawler/1.0"])(
    "%s is one",
    ua => expect(isBot(ua)).toBe(true),
  );

  it("a phone, and a headless browser, are not", () => {
    expect(isBot(PHONE_UA)).toBe(false);
    expect(isBot("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 HeadlessChrome/140.0.0.0 Safari/537.36")).toBe(false);
  });

  it("get the control page and no cookie, whatever they send", () => {
    const res = visit(`https://${ROYAT}/fr`, { "user-agent": "Googlebot/2.1", cookie: "ab_hero_call_first=b; ab_quote_price_anchor=b" });
    expect(res).toEqual({ rewrite: "/fr/_royat", cookies: [] });
  });
});

describe("the proxy's assignment", () => {
  it("gives a new visitor a sticky cookie per experiment", () => {
    const { cookies } = visit(`https://${ROYAT}/fr`);
    expect(cookies.map(c => c.split("=")[0] ?? "").sort()).toEqual(["ab_hero_call_first", "ab_quote_price_anchor"]);
  });

  it("rewrites a point's home to its visitor's bucket, and leaves the control on the plain path", () => {
    expect(visit(`https://${ROYAT}/fr`, { cookie: "ab_hero_call_first=b; ab_quote_price_anchor=a" })).toEqual({ rewrite: "/fr/_royat/ab/ba", cookies: [] });
    expect(visit(`https://${ROYAT}/en`, { cookie: "ab_hero_call_first=a; ab_quote_price_anchor=a" })).toEqual({ rewrite: "/en/_royat", cookies: [] });
    expect(visit("https://aquafix.top/fr/royat", { cookie: "ab_hero_call_first=b; ab_quote_price_anchor=b" }).rewrite).toBe("/fr/royat/ab/bb");
  });

  it("assigns on a point's other pages without rewriting them: nothing there differs", () => {
    const res = visit(`https://${ROYAT}/fr/prices`);
    expect(res.rewrite).toBe("/fr/_royat/prices");
    expect(res.cookies).toHaveLength(2);
  });

  it("forces a variant from the query, and marks the browser as QA's", () => {
    const res = visit(`https://${ROYAT}/fr?ab_quote_price_anchor=b`, { cookie: "ab_hero_call_first=a; ab_quote_price_anchor=a" });
    expect(res.rewrite).toBe("/fr/_royat/ab/ab");
    expect(res.cookies.sort()).toEqual(["ab_forced=1", "ab_quote_price_anchor=b"]);
    // A variant the test does not declare forces nothing.
    expect(visit(`https://${ROYAT}/fr?ab_quote_price_anchor=z`, { cookie: "ab_hero_call_first=a; ab_quote_price_anchor=a" }).cookies).toEqual([]);
  });

  it("does not assign again on Next's second pass over the rewritten path", () => {
    expect(visit("http://localhost:3000/fr/_royat/ab/bb", { cookie: "" })).toEqual({ rewrite: null, cookies: [] });
    expect(visit("http://localhost:3000/fr/_royat", { cookie: "" })).toEqual({ rewrite: null, cookies: [] });
  });

  it("leaves the brand's pages, /quote and dead paths to kitstart", () => {
    expect(visit("https://aquafix.top/fr").cookies).toEqual([]);
    expect(visit(`https://${ROYAT}/quote`).cookies).toEqual([]);
    expect(visit(`https://${ROYAT}/fr/_royat/ab/zz`).rewrite).toBe("/fr/404/404");
  });
});

describe("reading the cookies back", () => {
  it("takes only enabled experiments the browser carries, a bad value as control", () => {
    const read = cookieReader("lang=fr; ab_hero_call_first=b; ab_quote_price_anchor=%7A; ab_forced=1");
    expect(assignedVariants(read)).toEqual({ hero_call_first: "b", quote_price_anchor: "a" });
    expect(assignedVariants(cookieReader(null))).toEqual({});
  });
});

describe("experiment_lead", () => {
  const captured = vi.fn<(body: string) => void>();
  afterEach(() => {
    captured.mockReset();
    vi.unstubAllGlobals();
  });

  function route() {
    vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
      captured(String(init.body));
      return new Response(null);
    });
    const tasks: (() => Promise<void> | void)[] = [];
    const leads = experimentLeads({
      target: () => ({ key: "phc_test", host: "https://ph.invalid", brandId: site.brand.id }),
      later: task => void tasks.push(task),
    });
    const store: LeadStore = {
      insert: async () => 7,
      count: async () => 1,
      schemaVersion: async () => 4,
      health: async () => {},
      close: async () => {},
    };
    const post = leads.wrap(
      quoteRoute(site, {
        env: () => ({ leadsDb: { kind: "sqlite", path: ":memory:" }, posthogKey: null, posthogHost: "https://ph.invalid", trustedProxy: { xffHops: 1 } }),
        notifier: () => ({ notify: async () => {} }),
        unavailable: () => ({ title: "", heading: "", body: "", callLabel: "" }),
        store: () => store,
        defer: leads.defer,
        now: () => 1_000_000,
        log: { warn: () => {}, error: () => {} },
      }),
    );
    const run = async () => {
      for (const task of tasks.splice(0)) await task();
    };
    return { post, run };
  }

  const submit = (cookie: string, extra: Record<string, string> = {}) =>
    new Request("https://royat.aquafix.top/quote", {
      method: "POST",
      headers: { cookie, "content-type": "application/x-www-form-urlencoded", "x-forwarded-for": "203.0.113.9" },
      body: new URLSearchParams({ location: "royat", locale: "fr", job: "blocked_drain", zip: "63130", mobile: "0612345678", [RENDERED_AT_FIELD]: "900000", ...extra }),
    });

  it("goes out once per experiment for an accepted lead, with the variant and the point", async () => {
    const { post, run } = route();
    const res = await post(submit("ab_hero_call_first=b; ab_quote_price_anchor=a"));
    expect(res.status).toBe(303);
    await run();
    const events = captured.mock.calls.map(([body]) => JSON.parse(body) as { event: string; properties: Record<string, unknown> });
    expect(events.map(e => [e.event, e.properties["experiment"], e.properties["variant"], e.properties["forced"], e.properties["location_id"]])).toEqual([
      ["experiment_lead", "hero_call_first", "b", false, "royat"],
      ["experiment_lead", "quote_price_anchor", "a", false, "royat"],
    ]);
  });

  it("stays silent for a lead held as spam, a rejected one, and a visitor in no test", async () => {
    const { post, run } = route();
    expect((await post(submit("ab_hero_call_first=b", { [HONEYPOT_FIELD]: "http://spam" }))).status).toBe(303);
    expect((await post(submit("ab_hero_call_first=b", { mobile: "12" }))).status).toBe(303);
    expect((await post(submit(""))).status).toBe(303);
    await run();
    expect(captured).not.toHaveBeenCalled();
  });
});

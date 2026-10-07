import { HONEYPOT_FIELD, RENDERED_AT_FIELD, type LeadStore } from "@evinvest/kitstart";
import { quoteRoute } from "@evinvest/kitstart/next";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { applyOverrides, type ExperimentOverrides } from "@evinvest/experiments";
import { createExperimentProxy } from "@/features/experiments/proxy";
import { experimentLeads } from "@/features/experiments/server";
import { CONTROL, EXPERIMENT_SUMMARIES, EXPERIMENTS, FORCED_MAX_AGE } from "@/shared/config/experiments";
import { site } from "@/shared/config/site";
import { assignedVariants, cookieReader, decodeBucket, encodeBucket, isBot, isForced, isSuperseded } from "@/shared/lib/experiments";

const ROYAT = "royat.aquafix.top";
const PHONE_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1";

/** The code's config under `overrides`, as the panel's answer would make it. */
const live = (overrides: ExperimentOverrides = {}) => async () => applyOverrides(EXPERIMENTS, overrides);

async function visit(url: string, headers: Record<string, string> = {}, overrides: ExperimentOverrides = {}) {
  const host = new URL(url).host;
  const proxy = createExperimentProxy(live(overrides));
  const res = await proxy(new NextRequest(new URL(url), { headers: { host, "user-agent": PHONE_UA, ...headers } }));
  return {
    rewrite: res.headers.get("x-middleware-rewrite") ? new URL(res.headers.get("x-middleware-rewrite") ?? "").pathname : null,
    cookies: res.headers.getSetCookie().map(c => c.split(";")[0] ?? ""),
  };
}

describe("the variant bucket in the path", () => {
  it("round-trips every non-control assignment and keeps the control's plain URL", () => {
    expect(encodeBucket(CONTROL)).toBeNull();
    let buckets = 0;
    for (const hero of ["a", "b"] as const) {
      for (const form of ["a", "b", "c"] as const) {
        for (const channel of ["a", "b", "c", "d", "e", "f", "g"] as const) {
          const assignment = { hero_call_first: hero, lead_form: form, lead_channel: channel };
          const bucket = encodeBucket(assignment);
          if (bucket) {
            buckets += 1;
            expect(decodeBucket(EXPERIMENTS, bucket)).toEqual(assignment);
          }
        }
      }
    }
    // 2 × 3 × 7 assignments, all but the control's with a bucket of their own.
    expect(buckets).toBe(41);
  });

  it("spells a bucket one letter per experiment, in config order, lead_channel last", () => {
    expect(encodeBucket({ hero_call_first: "a", lead_form: "a", lead_channel: "g" })).toBe("aag");
    expect(encodeBucket({ hero_call_first: "b", lead_form: "c", lead_channel: "a" })).toBe("bca");
  });

  it("refuses a bucket the proxy never writes", () => {
    // Two letters is a bucket from before lead_channel: a stale link, not a page.
    for (const junk of ["aa", "zz", "b", "bd", "ca", "bb", "aaa", "zzz", "bdb", "cab", "bah", "bbbb", "~ab", "", "Bba", "abG"]) {
      expect(decodeBucket(EXPERIMENTS, junk), junk).toBeNull();
    }
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

  it("get the control page and no cookie, whatever they send", async () => {
    const res = await visit(`https://${ROYAT}/fr`, { "user-agent": "Googlebot/2.1", cookie: "ab_hero_call_first=b; ab_lead_form=c; ab_lead_channel=e" });
    expect(res).toEqual({ rewrite: "/fr/_royat", cookies: [] });
  });
});

describe("the proxy's assignment", () => {
  it("gives a new visitor a sticky cookie per experiment", async () => {
    const { cookies } = await visit(`https://${ROYAT}/fr`);
    expect(cookies.map(c => c.split("=")[0] ?? "").sort()).toEqual(["ab_hero_call_first", "ab_lead_channel", "ab_lead_form"]);
  });

  it("rewrites a point's home to its visitor's bucket, and leaves the control on the plain path", async () => {
    expect(await visit(`https://${ROYAT}/fr`, { cookie: "ab_hero_call_first=b; ab_lead_form=a; ab_lead_channel=a" })).toEqual({ rewrite: "/fr/_royat/ab/baa", cookies: [] });
    expect(await visit(`https://${ROYAT}/fr`, { cookie: "ab_hero_call_first=a; ab_lead_form=b; ab_lead_channel=a" })).toEqual({ rewrite: "/fr/_royat/ab/aba", cookies: [] });
    expect(await visit(`https://${ROYAT}/fr`, { cookie: "ab_hero_call_first=a; ab_lead_form=c; ab_lead_channel=a" })).toEqual({ rewrite: "/fr/_royat/ab/aca", cookies: [] });
    expect(await visit(`https://${ROYAT}/fr`, { cookie: "ab_hero_call_first=a; ab_lead_form=a; ab_lead_channel=g" })).toEqual({ rewrite: "/fr/_royat/ab/aag", cookies: [] });
    expect(await visit(`https://${ROYAT}/en`, { cookie: "ab_hero_call_first=a; ab_lead_form=a; ab_lead_channel=a" })).toEqual({ rewrite: "/en/_royat", cookies: [] });
    expect((await visit("https://aquafix.top/fr/royat", { cookie: "ab_hero_call_first=b; ab_lead_form=c; ab_lead_channel=d" })).rewrite).toBe("/fr/royat/ab/bcd");
  });

  it("assigns on a point's other pages without rewriting them: nothing there differs", async () => {
    const res = await visit(`https://${ROYAT}/fr/prices`);
    expect(res.rewrite).toBe("/fr/_royat/prices");
    expect(res.cookies).toHaveLength(3);
  });

  it("forces a variant from the query, and marks the browser as QA's", async () => {
    const res = await visit(`https://${ROYAT}/fr?ab_lead_form=b`, { cookie: "ab_hero_call_first=a; ab_lead_form=a; ab_lead_channel=a" });
    expect(res.rewrite).toBe("/fr/_royat/ab/aba");
    expect(res.cookies.sort()).toEqual(["ab__qa=1", "ab_lead_form=b"]);
    expect((await visit(`https://${ROYAT}/fr?ab_lead_form=c`, { cookie: "ab_hero_call_first=a; ab_lead_form=a; ab_lead_channel=a" })).rewrite).toBe("/fr/_royat/ab/aca");
    // A variant the test does not declare forces nothing.
    expect((await visit(`https://${ROYAT}/fr?ab_lead_form=z`, { cookie: "ab_hero_call_first=a; ab_lead_form=a; ab_lead_channel=a" })).cookies).toEqual([]);
  });

  it("forces every lead_channel arm from the query, the AbSwitcher's way in", async () => {
    const cookie = "ab_hero_call_first=a; ab_lead_form=a; ab_lead_channel=a";
    const forced = await visit(`https://${ROYAT}/fr?ab_lead_channel=e`, { cookie });
    expect(forced.rewrite).toBe("/fr/_royat/ab/aae");
    expect(forced.cookies.sort()).toEqual(["ab__qa=1", "ab_lead_channel=e"]);
    expect((await visit(`https://${ROYAT}/fr?ab_lead_channel=b`, { cookie })).rewrite).toBe("/fr/_royat/ab/aab");
    expect((await visit(`https://${ROYAT}/fr?ab_lead_channel=g`, { cookie })).rewrite).toBe("/fr/_royat/ab/aag");
    // `h` is no arm: nothing is forced, the page stays the control's.
    expect(await visit(`https://${ROYAT}/fr?ab_lead_channel=h`, { cookie })).toEqual({ rewrite: "/fr/_royat", cookies: [] });
  });

  it("keeps QA's mark as long as the forced variant, so a closed browser stays a test", async () => {
    const proxy = createExperimentProxy(live());
    const headers = { host: ROYAT, "user-agent": PHONE_UA, cookie: "ab_hero_call_first=a; ab_lead_form=a; ab_lead_channel=a" };
    const setCookies = (await proxy(new NextRequest(new URL(`https://${ROYAT}/fr?ab_lead_form=b`), { headers }))).headers.getSetCookie();
    const maxAge = (name: string) => /max-age=(\d+)/i.exec(setCookies.find(c => c.startsWith(`${name}=`)) ?? "")?.[1];
    expect(maxAge("ab__qa")).toBeDefined();
    expect(maxAge("ab__qa")).toBe(maxAge("ab_lead_form"));
  });

  it("moves QA's legacy mark to its new name on the next visit, for as long", async () => {
    const proxy = createExperimentProxy(live());
    const headers = { host: ROYAT, "user-agent": PHONE_UA, cookie: "ab_hero_call_first=a; ab_lead_form=b; ab_lead_channel=a; ab_forced=1" };
    const setCookies = (await proxy(new NextRequest(new URL(`https://${ROYAT}/fr`), { headers }))).headers.getSetCookie();
    expect(setCookies).toEqual([
      `ab__qa=1; Path=/; Max-Age=${FORCED_MAX_AGE}; SameSite=Lax`,
      "ab_forced=; Path=/; Max-Age=0; SameSite=Lax",
    ]);
    // Already moved: only the leftover is dropped; never marked: nothing.
    expect((await visit(`https://${ROYAT}/fr`, { cookie: "ab_hero_call_first=a; ab_lead_form=a; ab_lead_channel=a; ab__qa=1; ab_forced=1" })).cookies).toEqual(["ab_forced="]);
    expect((await visit(`https://${ROYAT}/fr`, { cookie: "ab_hero_call_first=a; ab_lead_form=a; ab_lead_channel=a; ab__qa=1" })).cookies).toEqual([]);
  });

  it("forcing a legacy-marked browser sets the new mark once and drops the old", async () => {
    const res = await visit(`https://${ROYAT}/fr?ab_lead_form=c`, { cookie: "ab_hero_call_first=a; ab_lead_form=a; ab_lead_channel=a; ab_forced=1" });
    expect(res.cookies.sort()).toEqual(["ab__qa=1", "ab_forced=", "ab_lead_form=c"]);
  });

  it("does not assign again on Next's second pass over the rewritten path", async () => {
    expect(await visit("http://localhost:3000/fr/_royat/ab/bcd", { cookie: "" })).toEqual({ rewrite: null, cookies: [] });
    expect(await visit("http://localhost:3000/fr/_royat", { cookie: "" })).toEqual({ rewrite: null, cookies: [] });
  });

  it("leaves the brand's pages, /quote and dead paths to kitstart", async () => {
    expect((await visit("https://aquafix.top/fr")).cookies).toEqual([]);
    expect((await visit(`https://${ROYAT}/quote`)).cookies).toEqual([]);
    expect((await visit(`https://${ROYAT}/fr/_royat/ab/zz`)).rewrite).toBe("/fr/404/404");
    expect((await visit(`https://${ROYAT}/fr/_royat/ab/bc`)).rewrite).toBe("/fr/404/404");
  });
});

describe("the panel's overrides", () => {
  const HERO_OFF = { hero_call_first: { enabled: false } };

  it("give a test the panel switched off its control letter, even with a cookie for b, and drop that cookie", async () => {
    const res = await visit(`https://${ROYAT}/fr`, { cookie: "ab_hero_call_first=b; ab_lead_form=b; ab_lead_channel=a" }, HERO_OFF);
    expect(res).toEqual({ rewrite: "/fr/_royat/ab/aba", cookies: ["ab_hero_call_first="] });
    // All control once the switched-off test is: the plain, shared cache entry.
    expect(await visit(`https://${ROYAT}/fr`, { cookie: "ab_hero_call_first=b; ab_lead_form=a; ab_lead_channel=a" }, HERO_OFF)).toEqual({
      rewrite: "/fr/_royat",
      cookies: ["ab_hero_call_first="],
    });
  });

  it("neither assign nor force a switched-off test, nor pass a bucket with its b", async () => {
    const fresh = await visit(`https://${ROYAT}/fr?ab_hero_call_first=b`, {}, HERO_OFF);
    expect(fresh.cookies.map(c => c.split("=")[0]).sort()).toEqual(["ab_lead_channel", "ab_lead_form"]);
    expect(fresh.rewrite ?? "").not.toMatch(/\/ab\/b/);
    expect(decodeBucket(applyOverrides(EXPERIMENTS, HERO_OFF), "baa")).toBeNull();
    expect((await visit(`https://${ROYAT}/fr/_royat/ab/baa`, {}, HERO_OFF)).rewrite).toBe("/fr/404/404");
  });

  it("switching lead_channel off draws the control card for a visitor it had in an arm", async () => {
    const CHANNEL_OFF = { lead_channel: { enabled: false } };
    expect(await visit(`https://${ROYAT}/fr`, { cookie: "ab_hero_call_first=a; ab_lead_form=a; ab_lead_channel=e" }, CHANNEL_OFF)).toEqual({
      rewrite: "/fr/_royat",
      cookies: ["ab_lead_channel="],
    });
    expect(decodeBucket(applyOverrides(EXPERIMENTS, CHANNEL_OFF), "aae")).toBeNull();
  });

  it("re-weight new visitors only: an arm already carried is kept", async () => {
    const ALL_A = { hero_call_first: { weights: [1, 0] }, lead_form: { weights: [1, 0, 0] }, lead_channel: { weights: [1, 0, 0, 0, 0, 0, 0] } };
    expect((await visit(`https://${ROYAT}/fr`, {}, ALL_A)).rewrite).toBe("/fr/_royat");
    expect((await visit(`https://${ROYAT}/fr`, { cookie: "ab_hero_call_first=b; ab_lead_form=c; ab_lead_channel=f" }, ALL_A)).rewrite).toBe("/fr/_royat/ab/bcf");
  });

  it("declare one summary per experiment, within the panel's 200 characters", () => {
    expect(Object.keys(EXPERIMENT_SUMMARIES).sort()).toEqual(Object.keys(EXPERIMENTS).sort());
    for (const summary of Object.values(EXPERIMENT_SUMMARIES)) expect(summary.length).toBeLessThanOrEqual(200);
  });
});

describe("reading the cookies back", () => {
  it("takes only enabled experiments the browser carries, a bad value as control", () => {
    const read = cookieReader("lang=fr; ab_hero_call_first=b; ab_lead_form=%7A; ab_lead_channel=g; ab_quote_price_anchor=b; ab_forced=1");
    // An ended test's leftover cookie is not an experiment any more.
    expect(assignedVariants(EXPERIMENTS, read)).toEqual({ hero_call_first: "b", lead_form: "a", lead_channel: "g" });
    expect(assignedVariants(EXPERIMENTS, cookieReader(null))).toEqual({});
  });

  it("takes QA's mark under its name or the legacy one, and nothing else", () => {
    expect(isForced(cookieReader("ab__qa=1"))).toBe(true);
    expect(isForced(cookieReader("lang=fr; ab_forced=1"))).toBe(true);
    expect(isForced(cookieReader("ab_lead_form=b"))).toBe(false);
    expect(isForced(cookieReader("ab__qa=; ab_forced=0"))).toBe(false);
    expect(isForced(cookieReader(null))).toBe(false);
  });
});

describe("lead_channel's precedence over lead_form", () => {
  it("marks lead_form superseded for any lead_channel arm but the control, where the card offered a messenger", () => {
    for (const channel of ["b", "c", "d", "e", "f", "g"]) {
      for (const offered of ["wa,tg", "wa", "tg"]) {
        expect(isSuperseded("lead_form", { lead_form: "c", lead_channel: channel }, offered), `${channel} ${offered}`).toBe(true);
      }
    }
  });

  // vifnet's rule: at a place with neither WhatsApp nor a bot the arm is inert, the card lead_form's.
  it("leaves lead_form alone where the card offered no messenger, or no card was read", () => {
    for (const channel of ["b", "c", "d", "e", "f", "g"]) {
      expect(isSuperseded("lead_form", { lead_form: "c", lead_channel: channel }, "none"), channel).toBe(false);
      expect(isSuperseded("lead_form", { lead_form: "c", lead_channel: channel }, null), channel).toBe(false);
    }
  });

  it("leaves lead_form alone under the control, or with no lead_channel cookie at all", () => {
    expect(isSuperseded("lead_form", { lead_form: "c", lead_channel: "a" }, "wa,tg")).toBe(false);
    expect(isSuperseded("lead_form", { lead_form: "c" }, "wa,tg")).toBe(false);
  });

  it("never marks lead_channel or hero_call_first", () => {
    expect(isSuperseded("lead_channel", { lead_form: "b", lead_channel: "e" }, "wa,tg")).toBe(false);
    expect(isSuperseded("hero_call_first", { hero_call_first: "b", lead_form: "b", lead_channel: "e" }, "wa,tg")).toBe(false);
  });
});

describe("experiment_lead", () => {
  const captured = vi.fn<(body: string) => void>();
  afterEach(() => {
    captured.mockReset();
    vi.unstubAllGlobals();
  });

  function route(overrides: ExperimentOverrides = {}) {
    vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
      captured(String(init.body));
      return new Response(null);
    });
    const tasks: (() => Promise<void> | void)[] = [];
    const leads = experimentLeads({
      target: () => ({ key: "phc_test", host: "https://ph.invalid", brandId: site.brand.id }),
      later: task => void tasks.push(task),
      live: live(overrides),
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
    const res = await post(submit("ab_hero_call_first=b; ab_lead_form=c; ab_lead_channel=a"));
    expect(res.status).toBe(303);
    await run();
    const events = captured.mock.calls.map(([body]) => JSON.parse(body) as { event: string; properties: Record<string, unknown> });
    expect(events.map(e => [e.event, e.properties["experiment"], e.properties["variant"], e.properties["forced"], e.properties["location_id"]])).toEqual([
      ["experiment_lead", "hero_call_first", "b", false, "royat"],
      ["experiment_lead", "lead_form", "c", false, "royat"],
      ["experiment_lead", "lead_channel", "a", false, "royat"],
    ]);
  });

  it("marks lead_form's lead superseded when lead_channel drew the card, and no other test's", async () => {
    const { post, run } = route();
    expect((await post(submit("ab_hero_call_first=b; ab_lead_form=c; ab_lead_channel=e", { channels_available: "wa,tg" }))).status).toBe(303);
    await run();
    const events = captured.mock.calls.map(([body]) => JSON.parse(body) as { properties: Record<string, unknown> });
    expect(events.map(e => [e.properties["experiment"], e.properties["variant"], e.properties["superseded"]])).toEqual([
      ["hero_call_first", "b", undefined],
      ["lead_form", "c", true],
      ["lead_channel", "e", undefined],
    ]);
  });

  it("does not mark lead_form's lead when the card offered no messenger: the lead_channel arm was inert", async () => {
    const { post, run } = route();
    expect((await post(submit("ab_hero_call_first=b; ab_lead_form=c; ab_lead_channel=e", { channels_available: "none" }))).status).toBe(303);
    await run();
    const events = captured.mock.calls.map(([body]) => JSON.parse(body) as { properties: Record<string, unknown> });
    expect(events).toHaveLength(3);
    for (const e of events) expect(e.properties, String(e.properties["experiment"])).not.toHaveProperty("superseded");
  });

  it("does not mark lead_form's lead under lead_channel's control: the property is absent, not false", async () => {
    const { post, run } = route();
    expect((await post(submit("ab_hero_call_first=a; ab_lead_form=b; ab_lead_channel=a"))).status).toBe(303);
    await run();
    const events = captured.mock.calls.map(([body]) => JSON.parse(body) as { properties: Record<string, unknown> });
    expect(events).toHaveLength(3);
    for (const e of events) expect(e.properties, String(e.properties["experiment"])).not.toHaveProperty("superseded");
  });

  it("sends a WhatsApp lead with no phone and no postcode as a lead of every test", async () => {
    const { post, run } = route();
    const res = await post(submit("ab_hero_call_first=a; ab_lead_form=a; ab_lead_channel=e", { channel: "whatsapp", message_ref: "AQ-7K3F", zip: "", mobile: "" }));
    expect(res.status).toBe(303);
    await run();
    const events = captured.mock.calls.map(([body]) => JSON.parse(body) as { properties: Record<string, unknown> });
    expect(events.map(e => [e.properties["experiment"], e.properties["variant"]])).toEqual([
      ["hero_call_first", "a"],
      ["lead_form", "a"],
      ["lead_channel", "e"],
    ]);
  });

  it("leaves out a test the panel switched off, whatever the cookie says", async () => {
    const { post, run } = route({ hero_call_first: { enabled: false } });
    expect((await post(submit("ab_hero_call_first=b; ab_lead_form=c; ab_lead_channel=a"))).status).toBe(303);
    await run();
    const events = captured.mock.calls.map(([body]) => JSON.parse(body) as { properties: Record<string, unknown> });
    expect(events.map(e => e.properties["experiment"])).toEqual(["lead_form", "lead_channel"]);
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

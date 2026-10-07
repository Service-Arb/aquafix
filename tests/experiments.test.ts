import { HONEYPOT_FIELD, RENDERED_AT_FIELD, type LeadStore } from "@evinvest/kitstart";
import { quoteRoute } from "@evinvest/kitstart/next";
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { applyOverrides, type ExperimentOverrides } from "@evinvest/experiments";
import { createExperimentProxy } from "@/features/experiments/proxy";
import { experimentLeads } from "@/features/experiments/server";
import { AB_SWITCHER_EXPERIMENTS, CONTROL, EXPERIMENT_SUMMARIES, EXPERIMENTS, FORCED_MAX_AGE } from "@/shared/config/experiments";
import { site } from "@/shared/config/site";
import {
  abSwitcherExperiments,
  assignedVariants,
  cookieReader,
  decodeBucket,
  decodeQaSnapshot,
  encodeBucket,
  encodeQaSnapshot,
  isBot,
  isForced,
  isSuperseded,
  leadChannelRuns,
} from "@/shared/lib/experiments";

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

/** The response's `Set-Cookie` headers in full, attributes included. */
async function setCookies(url: string, cookie: string, overrides: ExperimentOverrides = {}) {
  const proxy = createExperimentProxy(live(overrides));
  const res = await proxy(new NextRequest(new URL(url), { headers: { host: new URL(url).host, "user-agent": PHONE_UA, cookie } }));
  return res.headers.getSetCookie();
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
    // The mark holds the visitor's own variants, from before the force.
    expect(res.cookies.sort()).toEqual(["ab__qa=hero_call_first.a~lead_form.a~lead_channel.a", "ab_lead_form=b"]);
    expect((await visit(`https://${ROYAT}/fr?ab_lead_form=c`, { cookie: "ab_hero_call_first=a; ab_lead_form=a; ab_lead_channel=a" })).rewrite).toBe("/fr/_royat/ab/aca");
    // A variant the test does not declare forces nothing.
    expect((await visit(`https://${ROYAT}/fr?ab_lead_form=z`, { cookie: "ab_hero_call_first=a; ab_lead_form=a; ab_lead_channel=a" })).cookies).toEqual([]);
  });

  it("forces every lead_channel arm from the query, the AbSwitcher's way in", async () => {
    const cookie = "ab_hero_call_first=a; ab_lead_form=a; ab_lead_channel=a";
    const forced = await visit(`https://${ROYAT}/fr?ab_lead_channel=e`, { cookie });
    expect(forced.rewrite).toBe("/fr/_royat/ab/aae");
    expect(forced.cookies.sort()).toEqual(["ab__qa=hero_call_first.a~lead_form.a~lead_channel.a", "ab_lead_channel=e"]);
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

  it("drops QA's legacy mark on the next visit to a point, without moving it to the new name", async () => {
    // Not forced, not marked under the new name: an ordinary visit, the old name just goes.
    expect(await setCookies(`https://${ROYAT}/fr`, "ab_hero_call_first=a; ab_lead_form=b; ab_lead_channel=a; ab_forced=1")).toEqual([
      "ab_forced=; Path=/; Max-Age=0; SameSite=Lax",
    ]);
    expect(await visit(`https://${ROYAT}/fr/prices`, { cookie: "ab_hero_call_first=a; ab_lead_form=b; ab_lead_channel=a; ab_forced=1" })).toEqual({
      rewrite: "/fr/_royat/prices",
      cookies: ["ab_forced="],
    });
  });

  it("forcing a legacy-marked browser saves the snapshot under the new name and drops the old", async () => {
    const res = await visit(`https://${ROYAT}/fr?ab_lead_form=c`, { cookie: "ab_hero_call_first=a; ab_lead_form=a; ab_lead_channel=a; ab_forced=1" });
    expect(res.cookies.sort()).toEqual(["ab__qa=hero_call_first.a~lead_form.a~lead_channel.a", "ab_forced=", "ab_lead_form=c"]);
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

describe("QA's snapshot of the visitor's own variants", () => {
  // The visitor's own draw throughout: hero b, lead_form a, lead_channel d.
  const OWN = "hero_call_first.b~lead_form.a~lead_channel.d";

  it("forcing a second test gives the first one back its own variant: the URL is the whole QA state", async () => {
    const first = await visit(`https://${ROYAT}/fr?ab_lead_channel=c`, { cookie: "ab_hero_call_first=b; ab_lead_form=a; ab_lead_channel=d" });
    expect(first.rewrite).toBe("/fr/_royat/ab/bac");
    expect(first.cookies.sort()).toEqual([`ab__qa=${OWN}`, "ab_lead_channel=c"]);

    const second = await visit(`https://${ROYAT}/fr?ab_lead_form=c`, { cookie: `ab_hero_call_first=b; ab_lead_form=a; ab_lead_channel=c; ab__qa=${OWN}` });
    expect(second.rewrite).toBe("/fr/_royat/ab/bcd");
    expect(second.cookies.sort()).toEqual([`ab__qa=${OWN}`, "ab_lead_channel=d", "ab_lead_form=c"]);
  });

  it("opening the point's home without a force gives back every own variant and drops the mark", async () => {
    const cookie = `ab_hero_call_first=b; ab_lead_form=c; ab_lead_channel=a; ab__qa=${OWN}`;
    expect((await visit(`https://${ROYAT}/fr`, { cookie })).rewrite).toBe("/fr/_royat/ab/bad");
    expect((await setCookies(`https://${ROYAT}/fr`, cookie)).sort()).toEqual([
      "ab__qa=; Path=/; Max-Age=0; SameSite=Lax",
      `ab_lead_channel=d; Path=/; Max-Age=${FORCED_MAX_AGE}; SameSite=Lax`,
      `ab_lead_form=a; Path=/; Max-Age=${FORCED_MAX_AGE}; SameSite=Lax`,
    ]);
  });

  it("an invalid force at the home is no force: the visit leaves QA", async () => {
    const res = await visit(`https://${ROYAT}/fr?ab_lead_form=z`, { cookie: `ab_hero_call_first=b; ab_lead_form=c; ab_lead_channel=d; ab__qa=${OWN}` });
    expect(res.rewrite).toBe("/fr/_royat/ab/bad");
    expect(res.cookies.sort()).toEqual(["ab__qa=", "ab_lead_form=a"]);
  });

  it("a newcomer arriving with a force saves the draw they would have had, and gets one cookie for the forced test", async () => {
    // Weights pin the newcomer's draw to hero b, lead_form b, lead_channel f.
    const DRAW_BBF = { hero_call_first: { weights: [0, 1] }, lead_form: { weights: [0, 1, 0] }, lead_channel: { weights: [0, 0, 0, 0, 0, 1, 0] } };
    const res = await visit(`https://${ROYAT}/fr?ab_lead_form=c`, {}, DRAW_BBF);
    expect(res.rewrite).toBe("/fr/_royat/ab/bcf");
    expect(res.cookies.sort()).toEqual(["ab__qa=hero_call_first.b~lead_form.b~lead_channel.f", "ab_hero_call_first=b", "ab_lead_channel=f", "ab_lead_form=c"]);
  });

  it("a newcomer whose draw is the forced variant still gets one cookie for that test", async () => {
    const DRAW_ACA = { hero_call_first: { weights: [1, 0] }, lead_form: { weights: [0, 0, 1] }, lead_channel: { weights: [1, 0, 0, 0, 0, 0, 0] } };
    const res = await visit(`https://${ROYAT}/fr?ab_lead_form=c`, {}, DRAW_ACA);
    expect(res.cookies.sort()).toEqual(["ab__qa=hero_call_first.a~lead_form.c~lead_channel.a", "ab_hero_call_first=a", "ab_lead_channel=a", "ab_lead_form=c"]);
  });

  it("a newcomer's random draw gives the forced test a single cookie", async () => {
    const { cookies } = await visit(`https://${ROYAT}/fr?ab_lead_form=c`);
    expect(cookies.filter(c => c.startsWith("ab_lead_form="))).toEqual(["ab_lead_form=c"]);
  });

  it("a later force keeps the snapshot of the first, whatever the cookies hold by then", async () => {
    const res = await visit(`https://${ROYAT}/fr?ab_lead_form=b`, { cookie: `ab_hero_call_first=a; ab_lead_form=c; ab_lead_channel=g; ab__qa=${OWN}` });
    expect(res.cookies.find(c => c.startsWith("ab__qa="))).toBe(`ab__qa=${OWN}`);
  });

  it("a force on a page further in sets QA as the home's would", async () => {
    const res = await visit(`https://${ROYAT}/fr/prices?ab_lead_form=b`, { cookie: "ab_hero_call_first=b; ab_lead_form=a; ab_lead_channel=d" });
    expect(res.rewrite).toBe("/fr/_royat/prices");
    expect(res.cookies.sort()).toEqual([`ab__qa=${OWN}`, "ab_lead_form=b"]);
  });

  it("a page further in without a force neither leaves QA nor gives the variants back", async () => {
    const res = await visit(`https://${ROYAT}/fr/prices`, { cookie: `ab_hero_call_first=a; ab_lead_form=c; ab_lead_channel=g; ab__qa=${OWN}` });
    expect(res).toEqual({ rewrite: "/fr/_royat/prices", cookies: [] });
  });

  it("a test paused while in QA is dropped on leaving, not given back", async () => {
    const HERO_OFF = { hero_call_first: { enabled: false } };
    const res = await visit(`https://${ROYAT}/fr`, { cookie: `ab_hero_call_first=a; ab_lead_form=c; ab_lead_channel=d; ab__qa=${OWN}` }, HERO_OFF);
    expect(res.rewrite).toBe("/fr/_royat/ab/aad");
    expect(res.cookies.sort()).toEqual(["ab__qa=", "ab_hero_call_first=", "ab_lead_form=a"]);
  });

  describe("a browser marked before the snapshot (`ab__qa=1`)", () => {
    // Old prod left lead_form's forced b in the cookie.
    const STUCK = "ab_hero_call_first=a; ab_lead_form=b; ab_lead_channel=e; ab__qa=1";

    it("a force takes the snapshot from the cookies as they stand", async () => {
      const res = await visit(`https://${ROYAT}/fr?ab_lead_channel=c`, { cookie: STUCK });
      expect(res.rewrite).toBe("/fr/_royat/ab/abc");
      expect(res.cookies.sort()).toEqual(["ab__qa=hero_call_first.a~lead_form.b~lead_channel.e", "ab_lead_channel=c"]);
    });

    it("leaving QA only drops the mark: there is nothing to give back", async () => {
      expect((await visit(`https://${ROYAT}/fr`, { cookie: STUCK })).rewrite).toBe("/fr/_royat/ab/abe");
      expect(await setCookies(`https://${ROYAT}/fr`, STUCK)).toEqual(["ab__qa=; Path=/; Max-Age=0; SameSite=Lax"]);
    });
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

  it("takes any non-empty new mark as QA's: a snapshot, the empty snapshot, or the old `1`", () => {
    expect(isForced(cookieReader("ab__qa=hero_call_first.a~lead_form.b~lead_channel.c"))).toBe(true);
    expect(isForced(cookieReader("ab__qa=-"))).toBe(true);
    expect(isForced(cookieReader("ab__qa=1"))).toBe(true);
    expect(isForced(cookieReader("ab__qa="))).toBe(false);
  });
});

describe("QA's snapshot in the mark", () => {
  it("spells the variants in config order, whatever order it is given", () => {
    expect(encodeQaSnapshot({ lead_channel: "c", hero_call_first: "b", lead_form: "a" })).toBe("hero_call_first.b~lead_form.a~lead_channel.c");
    expect(encodeQaSnapshot({ lead_form: "c" })).toBe("lead_form.c");
  });

  it("spells the empty snapshot `-`, never an empty value, and reads it back as no entry", () => {
    expect(encodeQaSnapshot({})).toBe("-");
    expect(decodeQaSnapshot("-")).toEqual({});
  });

  it("round-trips a full and a partial snapshot", () => {
    expect(decodeQaSnapshot(encodeQaSnapshot({ hero_call_first: "b", lead_form: "c", lead_channel: "g" }))).toEqual({ hero_call_first: "b", lead_form: "c", lead_channel: "g" });
    expect(decodeQaSnapshot(encodeQaSnapshot({ lead_channel: "e" }))).toEqual({ lead_channel: "e" });
  });

  it.each([
    ["the old mark", "1"],
    ["an empty value", ""],
    ["an undeclared variant", "lead_form.z"],
    ["an unknown test", "quote_price_anchor.b"],
    ["a key without a variant", "lead_form"],
    ["an extra dot", "lead_form.a.b"],
    ["a trailing separator", "lead_form.a~"],
    ["a key in the wrong case", "LEAD_FORM.a"],
    ["a cookie-style pair", "lead_form=a"],
    ["one bad pair among good ones", "hero_call_first.b~lead_form.z~lead_channel.c"],
  ])("refuses %s as no snapshot", (_what, value) => {
    expect(decodeQaSnapshot(value)).toBeNull();
  });

  it("reads no cookie as no snapshot", () => {
    expect(decodeQaSnapshot(undefined)).toBeNull();
  });
});

describe("the QA menu's tests at one point", () => {
  it.each([["none"], [null], ["tg"]])("says lead_channel is inactive at a point whose channels are %s", channels => {
    expect(abSwitcherExperiments(channels).map(e => e.label)).toEqual(["Mobile hero", "Lead form", "Lead channel — inactive here (no WhatsApp)"]);
  });

  it("keeps lead_channel's arms where it is inactive: forcing it still works", () => {
    expect(abSwitcherExperiments("none").find(e => e.key === "lead_channel")?.variants).toEqual(AB_SWITCHER_EXPERIMENTS.find(e => e.key === "lead_channel")?.variants);
  });

  it.each([["wa"], ["wa,tg"]])("leaves the labels as declared at a point whose channels are %s", channels => {
    expect(abSwitcherExperiments(channels).map(e => e.label)).toEqual(["Mobile hero", "Lead form", "Lead channel"]);
  });
});

describe("lead_channel's precedence over lead_form", () => {
  // The test runs only at a place with its own WhatsApp: the bot alone draws the control in every arm.
  it("runs where the card offered WhatsApp, and nowhere else", () => {
    expect(leadChannelRuns("wa,tg")).toBe(true);
    expect(leadChannelRuns("wa")).toBe(true);
    expect(leadChannelRuns("tg")).toBe(false);
    expect(leadChannelRuns("none")).toBe(false);
    expect(leadChannelRuns(null)).toBe(false);
  });

  it("marks lead_form superseded when the card names lead_channel, the control's card included", () => {
    expect(isSuperseded("lead_form", "lead_channel")).toBe(true);
  });

  it("leaves lead_form alone when the card is lead_form's, or no card was read", () => {
    expect(isSuperseded("lead_form", "lead_form")).toBe(false);
    expect(isSuperseded("lead_form", null)).toBe(false);
  });

  it("never marks lead_channel or hero_call_first", () => {
    expect(isSuperseded("lead_channel", "lead_channel")).toBe(false);
    expect(isSuperseded("hero_call_first", "lead_channel")).toBe(false);
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

  it("marks lead_form's lead superseded when the card was lead_channel's, and says what it offered", async () => {
    const { post, run } = route();
    const card = { experiment: "lead_channel", variant: "e", channels_available: "wa,tg" };
    expect((await post(submit("ab_hero_call_first=b; ab_lead_form=c; ab_lead_channel=e", card))).status).toBe(303);
    await run();
    const events = captured.mock.calls.map(([body]) => JSON.parse(body) as { properties: Record<string, unknown> });
    expect(events.map(e => [e.properties["experiment"], e.properties["variant"], e.properties["superseded"], e.properties["channels_available"]])).toEqual([
      ["hero_call_first", "b", undefined, "wa,tg"],
      ["lead_form", "c", true, "wa,tg"],
      ["lead_channel", "e", undefined, "wa,tg"],
    ]);
  });

  it("marks lead_form's lead superseded under lead_channel's control too, where the test runs", async () => {
    const { post, run } = route();
    const card = { experiment: "lead_channel", variant: "a", channels_available: "wa" };
    expect((await post(submit("ab_hero_call_first=a; ab_lead_form=b; ab_lead_channel=a", card))).status).toBe(303);
    await run();
    const events = captured.mock.calls.map(([body]) => JSON.parse(body) as { properties: Record<string, unknown> });
    expect(events.find(e => e.properties["experiment"] === "lead_form")?.properties["superseded"]).toBe(true);
  });

  it("does not mark lead_form's lead when the card was lead_form's: the lead_channel arm was inert", async () => {
    const { post, run } = route();
    const card = { experiment: "lead_form", variant: "c", channels_available: "tg" };
    expect((await post(submit("ab_hero_call_first=b; ab_lead_form=c; ab_lead_channel=e", card))).status).toBe(303);
    await run();
    const events = captured.mock.calls.map(([body]) => JSON.parse(body) as { properties: Record<string, unknown> });
    expect(events).toHaveLength(3);
    for (const e of events) expect(e.properties, String(e.properties["experiment"])).not.toHaveProperty("superseded");
  });

  it("does not mark lead_form's lead from a card that posted no experiment: the property is absent, not false", async () => {
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
    // The lead's channel rides along: a messenger lead is an intent until its message arrives.
    expect(events.map(e => [e.properties["experiment"], e.properties["variant"], e.properties["channel"]])).toEqual([
      ["hero_call_first", "a", "whatsapp"],
      ["lead_form", "a", "whatsapp"],
      ["lead_channel", "e", "whatsapp"],
    ]);
  });

  it("says forced: true for a browser whose QA mark holds a snapshot", async () => {
    const { post, run } = route();
    expect((await post(submit("ab_hero_call_first=a; ab_lead_form=c; ab_lead_channel=a; ab__qa=hero_call_first.a~lead_form.a~lead_channel.a"))).status).toBe(303);
    await run();
    const events = captured.mock.calls.map(([body]) => JSON.parse(body) as { properties: Record<string, unknown> });
    expect(events.map(e => [e.properties["experiment"], e.properties["variant"], e.properties["forced"]])).toEqual([
      ["hero_call_first", "a", true],
      ["lead_form", "c", true],
      ["lead_channel", "a", true],
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

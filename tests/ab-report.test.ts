import { describe, expect, it } from "vitest";
import { betaSample, compare, hogql, render, seeded, summarise, verdict, type Row } from "../scripts/ab-report";

describe("the Beta-Binomial comparison", () => {
  it("draws Beta samples with the right mean", () => {
    const rng = seeded(1);
    let sum = 0;
    for (let i = 0; i < 20_000; i++) sum += betaSample(3, 7, rng);
    expect(sum / 20_000).toBeCloseTo(0.3, 2);
  });

  it("calls two identical arms a coin flip, with equal expected losses", () => {
    const c = compare({ successes: 50, trials: 1000 }, { successes: 50, trials: 1000 }, seeded(2), 50_000);
    expect(c.pBetter).toBeGreaterThan(0.45);
    expect(c.pBetter).toBeLessThan(0.55);
    expect(c.lossShipB).toBeCloseTo(c.lossKeepA, 3);
  });

  it("sees a clear winner, and puts the loss on the loser", () => {
    const c = compare({ successes: 30, trials: 1000 }, { successes: 70, trials: 1000 }, seeded(3), 50_000);
    expect(c.pBetter).toBeGreaterThan(0.999);
    expect(c.lossShipB).toBeLessThan(1e-4);
    expect(c.lossKeepA).toBeCloseTo(0.04, 2);
    expect(compare({ successes: 70, trials: 1000 }, { successes: 30, trials: 1000 }, seeded(3), 50_000).pBetter).toBeLessThan(0.001);
  });

  it("caps successes at trials: counts are per page view", () => {
    const c = compare({ successes: 500, trials: 100 }, { successes: 100, trials: 100 }, seeded(4), 10_000);
    expect(c.pBetter).toBeGreaterThan(0.3);
    expect(c.pBetter).toBeLessThan(0.7);
  });
});

describe("the stop rule", () => {
  const ready = { days: 15, exposures: [150, 140] };
  it("keeps running before 14 days or 100 exposures an arm, whatever the probability", () => {
    expect(verdict({ days: 13.9, exposures: [500, 500], primary: 0.999, guardrail: 0.9 })).toBe("keep running");
    expect(verdict({ days: 30, exposures: [500, 99], primary: 0.999, guardrail: 0.9 })).toBe("keep running");
  });
  it("ships b at 0.95, keeps a at 0.05, and waits between", () => {
    expect(verdict({ ...ready, primary: 0.95, guardrail: 0.5 })).toBe("ship b");
    expect(verdict({ ...ready, primary: 0.05, guardrail: 0.5 })).toBe("keep a");
    expect(verdict({ ...ready, primary: 0.6, guardrail: 0.99 })).toBe("keep running");
  });
  it("lets the lead-rate guardrail veto a win", () => {
    expect(verdict({ ...ready, primary: 0.99, guardrail: 0.03 })).toBe("keep a");
  });
});

describe("the report", () => {
  const rows: Row[] = [
    { experiment: "hero_call_first", variant: "a", event: "experiment_exposed", channel: null, count: 200, first: "2026-09-01T00:00:00Z" },
    { experiment: "hero_call_first", variant: "b", event: "experiment_exposed", channel: null, count: 210, first: "2026-09-02T00:00:00Z" },
    { experiment: "hero_call_first", variant: "a", event: "experiment_contact", channel: "phone", count: 10, first: "2026-09-03T00:00:00Z" },
    { experiment: "hero_call_first", variant: "b", event: "experiment_contact", channel: "phone", count: 30, first: "2026-09-03T00:00:00Z" },
    { experiment: "hero_call_first", variant: "b", event: "experiment_contact", channel: "whatsapp", count: 4, first: "2026-09-03T00:00:00Z" },
    { experiment: "hero_call_first", variant: "b", event: "experiment_contact", channel: "form_open", count: 5, first: "2026-09-03T00:00:00Z" },
    { experiment: "hero_call_first", variant: "a", event: "experiment_lead", channel: null, count: 3, first: "2026-09-03T00:00:00Z" },
    { experiment: "hero_call_first", variant: "b", event: "experiment_lead", channel: null, count: 3, first: "2026-09-03T00:00:00Z" },
  ];

  it("totals each arm and dates the test from its first exposure", () => {
    const [exp] = summarise(rows, new Date("2026-09-21T00:00:00Z"));
    expect(exp?.days).toBe(20);
    expect(exp?.arms["b"]).toEqual({ exposures: 210, leads: 3, calls: 30, whatsapp: 4, formOpens: 5 });
  });

  it("prints the rates and a verdict", () => {
    const text = render(summarise(rows, new Date("2026-09-21T00:00:00Z")), seeded(5));
    expect(text).toContain("hero_call_first — 20.0 days");
    expect(text).toContain("6.50 %"); // a: (3 + 10) / 200
    expect(text).toMatch(/verdict: ship b/);
  });

  it("decides lead_layout on the lead rate, with the contact rate as its guardrail", () => {
    const layout: Row[] = [
      { experiment: "lead_layout", variant: "a", event: "experiment_exposed", channel: null, count: 400, first: "2026-09-01T00:00:00Z" },
      { experiment: "lead_layout", variant: "b", event: "experiment_exposed", channel: null, count: 400, first: "2026-09-01T00:00:00Z" },
      // b loses on calls and wins on leads: contact rate alone would call it a draw.
      { experiment: "lead_layout", variant: "a", event: "experiment_contact", channel: "phone", count: 30, first: "2026-09-03T00:00:00Z" },
      { experiment: "lead_layout", variant: "b", event: "experiment_contact", channel: "phone", count: 10, first: "2026-09-03T00:00:00Z" },
      { experiment: "lead_layout", variant: "a", event: "experiment_lead", channel: null, count: 5, first: "2026-09-03T00:00:00Z" },
      { experiment: "lead_layout", variant: "b", event: "experiment_lead", channel: null, count: 25, first: "2026-09-03T00:00:00Z" },
    ];
    const text = render(summarise(layout, new Date("2026-09-21T00:00:00Z")), seeded(6));
    expect(text).toMatch(/P\(b > a\) lead rate +1\.000/);
    expect(text).toMatch(/P\(b > a\) contact rate +0\.\d+ \(guardrail\)/);
    expect(text).toMatch(/verdict: ship b/);
  });

  it("pools brands that run one test under one key", () => {
    expect(hogql("aquafix,vifnet", 90)).toContain("properties.brand_id IN ('aquafix', 'vifnet')");
    expect(() => hogql("aquafix,vif'net", 90)).toThrow();
  });

  it("quotes no untrusted value into the query", () => {
    expect(() => hogql("aquafix' OR 1=1 --", 90)).toThrow();
    expect(() => hogql("aquafix", 1.5)).toThrow();
    expect(hogql("aquafix", 90)).toContain("properties.brand_id = 'aquafix'");
  });
});

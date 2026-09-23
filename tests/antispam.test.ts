import { describe, expect, it } from "vitest";
import { checkTiming, MIN_FILL_MS, RateLimiter, screen } from "@/features/quote-form";

const NOW = 1_800_000_000_000;

describe("the form's barriers", () => {
  it("catches the honeypot", () => {
    const limiter = new RateLimiter(5, 60_000);
    expect(screen({ honeypot: "http://spam", renderedAt: String(NOW - 10_000), clientKey: "a", now: NOW, limiter })).toBe(
      "honeypot",
    );
    expect(screen({ honeypot: "", renderedAt: String(NOW - 10_000), clientKey: "a", now: NOW, limiter })).toBe("ok");
  });

  it("rejects a form filled faster than a person can, a missing stamp and a forged future one", () => {
    expect(checkTiming(String(NOW - MIN_FILL_MS + 1), NOW)).toBe("too-fast");
    expect(checkTiming(String(NOW - MIN_FILL_MS), NOW)).toBe("ok");
    expect(checkTiming(null, NOW)).toBe("too-fast");
    expect(checkTiming("soon", NOW)).toBe("too-fast");
    expect(checkTiming(String(NOW + 120_000), NOW)).toBe("too-fast");
  });

  it("limits one address per window and forgets it after", () => {
    const limiter = new RateLimiter(2, 60_000);
    expect(limiter.hit("1.2.3.4", NOW)).toBe(true);
    expect(limiter.hit("1.2.3.4", NOW + 1)).toBe(true);
    expect(limiter.hit("1.2.3.4", NOW + 2)).toBe(false);
    expect(limiter.hit("5.6.7.8", NOW + 3)).toBe(true);
    expect(limiter.hit("1.2.3.4", NOW + 60_000)).toBe(true);
  });
});

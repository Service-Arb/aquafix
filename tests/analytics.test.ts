import { afterEach, describe, expect, it, vi } from "vitest";
import { analyticsSink, EVENTS } from "@/features/analytics/events";

afterEach(() => vi.unstubAllGlobals());

describe("the event model", () => {
  it("refuses a customer's phone or address as a property in development", () => {
    const sink = analyticsSink({ key: null, host: "https://eu.i.posthog.com", brandId: "aquafix" }, "royat");
    expect(() => sink.capture(EVENTS.leadSubmit, { form_id: "quote", phone: "+33 6 12 34 56 78" })).toThrow();
    expect(() => sink.capture(EVENTS.intent, { channel: "phone" })).not.toThrow();
  });

  it("sends nothing without a key", () => {
    const beacon = vi.fn(() => true);
    vi.stubGlobal("navigator", { sendBeacon: beacon });
    analyticsSink({ key: null, host: "https://eu.i.posthog.com", brandId: "aquafix" }, "royat").capture(EVENTS.intent, { channel: "phone" });
    expect(beacon).not.toHaveBeenCalled();
  });

  it("beacons the intent with the brand and the point mixed in, and no cookie", () => {
    const beacon = vi.fn<(url: string, body: string) => boolean>(() => true);
    vi.stubGlobal("navigator", { sendBeacon: beacon });
    analyticsSink({ key: "phc_test", host: "https://eu.i.posthog.com", brandId: "aquafix" }, "royat").capture(EVENTS.intent, { channel: "whatsapp" });
    expect(beacon).toHaveBeenCalledTimes(1);
    const [url, body] = beacon.mock.calls[0]!;
    expect(url).toBe("https://eu.i.posthog.com/capture/");
    expect(JSON.parse(body)).toMatchObject({
      event: "contact_intent_click",
      properties: { brand_id: "aquafix", location_id: "royat", channel: "whatsapp" },
    });
  });
});

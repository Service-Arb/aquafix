import { describe, expect, it } from "vitest";
import { LEAD } from "@/shared/config/lead";
import { readCandidate, validateCandidate } from "@evinvest/kitstart";

const form = (fields: Record<string, string>): FormData => {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) data.set(k, v);
  return data;
};

describe("the lead schema", () => {
  it("reads aquafix's form under the Rust form's field names", () => {
    expect(readCandidate(LEAD, form({ job: " hot_water ", zip: "63130", mobile: "06 12 34 56 78" }), "royat")).toEqual({
      subject: "hot_water",
      locality: "63130",
      mobile: "+33612345678",
      extras: {},
      placeSlug: "royat",
      channel: "form",
    });
  });

  it("keeps the urgency lead_form c posts, and drops what the schema does not declare", () => {
    const candidate = readCandidate(LEAD, form({ job: "other", zip: "63130", mobile: "0612345678", urgency: "today", note: "x" }), null);
    expect(candidate.extras).toEqual({ urgency: "today" });
  });

  it("keeps the mobile as E.164 when it reads as one, and as typed when not", () => {
    const mobile = (typed: string) => readCandidate(LEAD, form({ job: "other", zip: "63130", mobile: typed }), null).mobile;
    expect(mobile("+33 (0)6 12 34 56 78")).toBe("+33612345678");
    expect(mobile("6 12 34 56 78")).toBe("+33612345678");
    expect(mobile("06 12 34")).toBe("06 12 34");
  });

  it("keeps a subject the form no longer offers — a stale page's lead is still a job", () => {
    expect(readCandidate(LEAD, form({ job: "gas_leak" }), null).subject).toBe("gas_leak");
  });

  it("refuses a number the form would block, naming the phone", () => {
    const lead = readCandidate(LEAD, form({ job: "other", zip: "63130", mobile: "0612" }), null);
    expect(validateCandidate(LEAD, lead)).toMatchObject({ field: "phone" });
  });

  it("refuses a lead with no commune, naming the locality the card shows the error at", () => {
    const lead = readCandidate(LEAD, form({ job: "other", zip: "   ", mobile: "06 12 34 56 78" }), null);
    expect(validateCandidate(LEAD, lead)).toEqual({ field: "locality", why: expect.any(String) });
  });

  it("takes any number kitstart's form takes — the old ten-digit floor refused +1 and short E.164", () => {
    for (const mobile of ["+1 415 555 0123", "+44 20 7946 0958", "+32 470 12 34 56", "06 12 34 56 78"]) {
      const lead = readCandidate(LEAD, form({ job: "other", zip: "63130", mobile }), null);
      expect(validateCandidate(LEAD, lead), mobile).toBeNull();
    }
  });

  // kitstart 0.11 holds common country codes to their national length, so a
  // short "+1" is no number any more — on the form and here alike.
  it("refuses what kitstart's form refuses: +1 with too few digits", () => {
    const lead = readCandidate(LEAD, form({ job: "other", zip: "63130", mobile: "+12345678" }), null);
    expect(validateCandidate(LEAD, lead)).toMatchObject({ field: "phone" });
  });
});

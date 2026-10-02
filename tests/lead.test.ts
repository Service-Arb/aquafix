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

  it("keeps the mobile as E.164 when it reads as one, and as typed when not", () => {
    const mobile = (typed: string) => readCandidate(LEAD, form({ job: "other", zip: "63130", mobile: typed }), null).mobile;
    expect(mobile("+33 (0)6 12 34 56 78")).toBe("+33612345678");
    expect(mobile("6 12 34 56 78")).toBe("+33612345678");
    expect(mobile("06 12 34")).toBe("06 12 34");
  });

  it("keeps a subject the form no longer offers — a stale page's lead is still a job", () => {
    expect(readCandidate(LEAD, form({ job: "gas_leak" }), null).subject).toBe("gas_leak");
  });

  it("refuses, for the log only, a lead with no number to text", () => {
    const lead = readCandidate(LEAD, form({ job: "other", zip: "63130", mobile: "0612" }), null);
    expect(validateCandidate(LEAD, lead)).toMatch(/mobile/);
  });
});

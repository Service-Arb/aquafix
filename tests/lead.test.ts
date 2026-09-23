import { describe, expect, it } from "vitest";
import { LEAD } from "@/shared/config/lead";
import { readCandidate, validateCandidate, type LeadSchema } from "@/shared/landing/core/lead";

const form = (fields: Record<string, string>): FormData => {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) data.set(k, v);
  return data;
};

describe("the lead schema", () => {
  it("reads aquafix's form under the Rust form's field names", () => {
    expect(readCandidate(LEAD, form({ job: " hot_water ", zip: "63130", mobile: "0612345678" }), "royat")).toEqual({
      subject: "hot_water",
      locality: "63130",
      mobile: "0612345678",
      extras: {},
      placeSlug: "royat",
    });
  });

  it("keeps a subject the form no longer offers — a stale page's lead is still a job", () => {
    expect(readCandidate(LEAD, form({ job: "gas_leak" }), null).subject).toBe("gas_leak");
  });

  it("reads a brand's extras, capped, and leaves out the empty ones", () => {
    const cleaning: LeadSchema<"flat" | "office"> = {
      subjects: ["flat", "office"],
      wire: { subject: "kind", locality: "city", mobile: "phone" },
      extras: [
        { name: "surface_m2", max: 4 },
        { name: "notes", max: 500 },
      ],
    };
    const lead = readCandidate(cleaning, form({ kind: "flat", surface_m2: "123456", notes: "  " }), null);
    expect(lead.extras).toEqual({ surface_m2: "1234" });
    // An extra's own cap, not the core fields' 200.
    const long = readCandidate(cleaning, form({ notes: "n".repeat(600) }), null);
    expect(long.extras.notes).toHaveLength(500);
    // No `validate` → every candidate is a lead.
    expect(validateCandidate(cleaning, lead)).toBeNull();
  });

  it("refuses, for the log only, a lead with no number to text", () => {
    const lead = readCandidate(LEAD, form({ job: "other", zip: "63130", mobile: "0612" }), null);
    expect(validateCandidate(LEAD, lead)).toMatch(/mobile/);
  });
});

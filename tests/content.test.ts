import { describe, expect, it } from "vitest";
import { factsFor, text, PRICE_LIST, type Facts } from "@/entities/content";
import { site } from "@/shared/config/site";
import { LOCALES, type Locale } from "@/shared/config/i18n";

// Completeness itself is the compiler's: `FR` and `EN` are checked against one
// `Text` with `satisfies`, so a missing field does not build. What the type
// cannot see is an empty string, or a sentence that quotes a fact by hand.

const facts = (locale: Locale): Facts => factsFor({ locale, place: "Royat", phone: site.brand.phone });

/** Every leaf string, with functions called on the facts, and its path. */
function leaves(value: unknown, f: Facts, path = ""): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (typeof value === "function") return leaves(value(f), f, `${path}()`);
  if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, f, `${path}[${i}]`));
  if (typeof value === "object" && value !== null) {
    return Object.entries(value).flatMap(([k, v]) => leaves(v, f, path ? `${path}.${k}` : k));
  }
  return [];
}

/** The same walk, keeping only the shape. */
const shape = (locale: Locale) => leaves(text(locale), facts(locale)).map(([path]) => path);

describe("the copy", () => {
  it.each(LOCALES)("has no empty string in %s", locale => {
    // The home page's eyebrow is empty by design: its eyebrow is the hero's own.
    const empty = leaves(text(locale), facts(locale)).filter(([path, s]) => s.trim() === "" && path !== "pages.home.eyebrow");
    expect(empty).toEqual([]);
  });

  it("has the same shape in both languages", () => {
    expect(shape("en")).toEqual(shape("fr"));
  });

  it.each(LOCALES)("quotes the phone from the card, never by hand (%s)", locale => {
    const t = text(locale);
    const f = facts(locale);
    for (const s of [t.callLabel(f), t.quoteForm.reassurance(f), t.guaranteeCtaAside(f)]) {
      expect(s).toContain(site.brand.phone);
    }
    const all = leaves(t, f).map(([, s]) => s);
    // No other number shaped like a French phone may appear in the copy.
    const phones = all.flatMap(s => s.match(/\+33[\d\s]{9,}/g) ?? []);
    expect(new Set(phones.map(p => p.trim()))).toEqual(new Set([site.brand.phone]));
  });

  it.each(LOCALES)("prices every row in euros and names every job (%s)", locale => {
    const t = text(locale);
    const f = facts(locale);
    for (const row of PRICE_LIST) {
      expect(t.prices[row.id].job).not.toBe("");
      expect(f.price(row.id)).toContain("€");
      expect(f.price(row.id).replace(/\D/g, "")).toBe(String(row.fromEur));
    }
  });

  it("keeps US units out of the French geography", () => {
    for (const locale of LOCALES) {
      const all = leaves(text(locale), facts(locale)).map(([, s]) => s).join("\n");
      expect(all).not.toMatch(/\$|\bmiles?\b|Portland|Oregon|\bZIP\b|CCB/);
    }
  });
});

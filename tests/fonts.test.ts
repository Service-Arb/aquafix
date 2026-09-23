import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..");

/** The `LATIN` list `scripts/subset-fonts.sh` cuts the web fonts to, as ranges. */
function subsetRanges(): Array<[number, number]> {
  const script = readFileSync(join(root, "scripts/subset-fonts.sh"), "utf8");
  const list = /^LATIN="([^"]+)"$/m.exec(script)?.[1];
  if (!list) throw new Error("scripts/subset-fonts.sh: no LATIN= line");
  return list.split(",").map(item => {
    const [lo, hi = lo] = item.replace(/^U\+/, "").split("-");
    return [parseInt(lo!, 16), parseInt(hi!, 16)];
  });
}

function sources(dir: string): string[] {
  return readdirSync(join(root, dir), { recursive: true, encoding: "utf8" })
    .filter(f => /\.tsx?$/.test(f))
    .map(f => join(dir, f));
}

// A character outside the subset still renders — in a fallback face, a
// mismatched glyph in the middle of a headline. Everything a visitor can read
// is written in these trees; entities/lead and entities/location only carry
// the odd ≥ or ─ in comments.
const RENDERED = ["src/entities/content", "src/widgets", "src/views", "src/shared/ui"];

describe("the web font subset", () => {
  it("covers every character the page copy uses", () => {
    const ranges = subsetRanges();
    const covered = (cp: number) => ranges.some(([lo, hi]) => cp >= lo && cp <= hi);
    const missing = new Map<string, string>();
    for (const file of RENDERED.flatMap(sources)) {
      for (const ch of readFileSync(join(root, file), "utf8")) {
        const cp = ch.codePointAt(0)!;
        if (!covered(cp) && !missing.has(ch)) missing.set(ch, `U+${cp.toString(16).toUpperCase()} in ${file}`);
      }
    }
    expect([...missing.values()]).toEqual([]);
  });
});

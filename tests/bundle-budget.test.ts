import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { firstLoadChunks, GATED_ROUTE, parseBudget } from "../scripts/bundle-budget";

// The gate fails closed: every way of reading nothing must be an error, never
// a total of zero that passes.
describe("bundle budget", () => {
  it("reads the committed budget", () => {
    expect(parseBudget(readFileSync("tests/bundle_budget.txt", "utf8"))).toBeGreaterThan(0);
  });

  it("takes the last non-comment line, and only a number", () => {
    expect(parseBudget("# why\n\n1234\n")).toBe(1234);
    expect(() => parseBudget("# only prose\n")).toThrow();
    expect(() => parseBudget("# why\n12 KB\n")).toThrow();
  });

  it("finds the gated route's chunks", () => {
    const stats = JSON.stringify([
      { route: "/health", firstLoadChunkPaths: [] },
      { route: GATED_ROUTE, firstLoadUncompressedJsBytes: 3, firstLoadChunkPaths: ["a.js", "b.js"] },
    ]);
    expect(firstLoadChunks(stats, GATED_ROUTE)).toEqual(["a.js", "b.js"]);
  });

  it("refuses a missing route or an empty chunk list", () => {
    expect(() => firstLoadChunks("[]", GATED_ROUTE)).toThrow(/no entry/);
    const empty = JSON.stringify([{ route: GATED_ROUTE, firstLoadChunkPaths: [] }]);
    expect(() => firstLoadChunks(empty, GATED_ROUTE)).toThrow(/no chunks/);
    expect(() => firstLoadChunks("{}", GATED_ROUTE)).toThrow(/array/);
  });
});

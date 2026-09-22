// The one hard gate: the gzip weight of the JavaScript a point page makes the
// browser download before it is interactive, against `tests/bundle_budget.txt`.
// Run after `npm run build` — `nix run .#size` does both.
//
// Plain `node` runs it (type stripping), so it imports nothing but builtins.
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

/** The page the visitor standing in water lands on. Every point page shares its chunks. */
export const GATED_ROUTE = "/[locale]/[location]";

const STATS = ".next/diagnostics/route-bundle-stats.json";
const BUDGET = "tests/bundle_budget.txt";

interface RouteStats {
  route: string;
  firstLoadChunkPaths: string[];
}

/** The budget file is commented prose; the number is its last non-comment line. */
export function parseBudget(text: string): number {
  const lines = text
    .split("\n")
    .map(l => l.trim())
    .filter(l => l !== "" && !l.startsWith("#"));
  const last = lines.at(-1);
  if (last === undefined || !/^\d+$/.test(last)) {
    throw new Error(`${BUDGET}: the last non-comment line must be a byte count, got ${JSON.stringify(last)}`);
  }
  return Number(last);
}

function isRouteStats(value: unknown): value is RouteStats {
  if (typeof value !== "object" || value === null) return false;
  const route: unknown = Reflect.get(value, "route");
  const chunks: unknown = Reflect.get(value, "firstLoadChunkPaths");
  return typeof route === "string" && Array.isArray(chunks) && chunks.every(c => typeof c === "string");
}

/**
 * The chunks Next itself lists as the route's first load. Undocumented output,
 * which is why a missing file or route is a failure and never a pass: a gate
 * that reads nothing and reports zero is worse than no gate.
 */
export function firstLoadChunks(statsJson: string, route: string): string[] {
  const parsed: unknown = JSON.parse(statsJson);
  if (!Array.isArray(parsed)) throw new Error(`${STATS}: expected an array of routes`);
  const entry = parsed.filter(isRouteStats).find(r => r.route === route);
  if (!entry) throw new Error(`${STATS}: no entry for ${route} — did the route move, or Next's diagnostics?`);
  if (entry.firstLoadChunkPaths.length === 0) throw new Error(`${STATS}: ${route} lists no chunks`);
  return entry.firstLoadChunkPaths;
}

/** gzip at zlib's default level, which is what Next's own server compresses with. */
export function gzipSize(bytes: Buffer): number {
  return gzipSync(bytes).length;
}

function main(root: string): number {
  let stats: string;
  try {
    stats = readFileSync(join(root, STATS), "utf8");
  } catch {
    console.error(`✘ ${STATS} is missing — run \`npm run build\` first`);
    return 1;
  }
  const budget = parseBudget(readFileSync(join(root, BUDGET), "utf8"));
  let total = 0;
  let raw = 0;
  for (const chunk of firstLoadChunks(stats, GATED_ROUTE)) {
    const bytes = readFileSync(join(root, chunk));
    const gz = gzipSize(bytes);
    total += gz;
    raw += bytes.length;
    console.log(`  ${String(gz).padStart(8)} B gz  ${relative(root, join(root, chunk))}`);
  }
  const kb = (n: number) => (n / 1024).toFixed(1);
  console.log(`  ${GATED_ROUTE}: ${kb(total)} KB gz (${kb(raw)} KB raw) / budget ${kb(budget)} KB gz`);
  if (total > budget) {
    console.error(`✘ over budget by ${total - budget} B. Raising ${BUDGET} is a deliberate commit, with a reason.`);
    return 1;
  }
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main(process.cwd());
}

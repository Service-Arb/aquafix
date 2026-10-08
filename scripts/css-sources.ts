// Writes `app/sources.css`: the files of the uikit's and the marketing layer's
// builds that Tailwind scans for class names — only those the app can reach
// from its imports, its own and kitstart's.
//
// Why not the whole `dist/` of each package: the uikit ships one barrel over
// every component it has, so scanning its `dist/` put the classes of the
// sidebar, the calendar, the chart… in the page's one render-blocking
// stylesheet (~40 KB of 131 KB raw). Tailwind cannot tree-shake; this walk does
// it the way the bundler does, at file granularity: a named import through a
// barrel follows only the re-exports that name it, and a file with code of its
// own is taken whole, with everything it imports.
//
// The list only narrows anything under `source(none)` (app/globals.css): with
// automatic detection on, Tailwind 4.3 widens a file `@source` inside an
// ignored directory to that whole directory, `.map` files included.
//
// Committed, like `app/brand.css`, so the build runs no step before `next
// build`. Rerun after bumping a package below or importing something new of
// theirs; `npm run css-sources -- --check` fails when the committed copy is
// stale.
//
//   npm run css-sources
//
// Plain `node` runs it (type stripping), so it imports nothing but builtins.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

/** The packages whose builds carry class literals (the uikit, the marketing layer, kitstart's widgets). */
export const PACKAGES = ["@evinvest/uikit", "@evinvest/marketing", "@evinvest/kitstart"] as const;

/**
 * The ones listed file by file. kitstart is walked — its widgets are how most
 * of the uikit is reached — but `app/globals.css` scans its `dist/` whole:
 * kitstart's landing contract (tests/contract.test.ts) asks for that line, and
 * nearly all of it is reachable anyway.
 */
const LISTED = ["@evinvest/uikit", "@evinvest/marketing"] as const;

/** The app's own code: Tailwind scans these whole (`app/globals.css`). */
const APP_DIRS = ["app", "src"];
const APP_FILES = ["proxy.ts", "instrumentation.ts"];

export const OUTPUT = "app/sources.css";

/** `"*"`: every export of the module (a namespace or side-effect import). */
type Names = readonly string[] | "*";

interface Binding {
  /** The name in the target module. */
  from: string;
  /** The name this module exports or binds it as. */
  as: string;
}

interface ReExport {
  spec: string;
  /** `null`: `export * from`. */
  names: Binding[] | null;
  /** `export * as ns from`. */
  namespace: string | null;
}

interface Import {
  spec: string;
  names: Names;
}

interface Parsed {
  reExports: ReExport[];
  imports: Import[];
  /** Anything beyond re-exports and imports: the file is taken whole. */
  ownCode: boolean;
}

const RE_EXPORT_NAMED = /export\s*(type\s+)?\{([^}]*)\}\s*from\s*["']([^"']+)["']/g;
const RE_EXPORT_STAR = /export\s*\*\s*(?:as\s+([\w$]+)\s*)?from\s*["']([^"']+)["']/g;
const IMPORT_FROM = /import\s*(type\s+)?([^"';]*?)\s*from\s*["']([^"']+)["']/g;
const IMPORT_BARE = /(?:^|[;\n}])\s*import\s*["']([^"']+)["']/g;
const IMPORT_DYNAMIC = /import\(\s*([^)]*?)\s*\)/g;
const REQUIRE = /\brequire\(\s*["']@evinvest\//;

function bindings(list: string): Binding[] {
  return list
    .split(",")
    .map(s => s.trim())
    .filter(s => s !== "" && !s.startsWith("type "))
    .map(s => {
      const [from = "", as = from] = s.split(/\s+as\s+/).map(x => x.trim());
      return { from, as };
    });
}

function parse(file: string): Parsed {
  const source = readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
  const reExports: ReExport[] = [];
  const imports: Import[] = [];
  for (const m of source.matchAll(RE_EXPORT_NAMED)) {
    if (m[1] === undefined) reExports.push({ spec: m[3] ?? "", names: bindings(m[2] ?? ""), namespace: null });
  }
  for (const m of source.matchAll(RE_EXPORT_STAR)) reExports.push({ spec: m[2] ?? "", names: null, namespace: m[1] ?? null });
  for (const m of source.matchAll(IMPORT_FROM)) {
    if (m[1] !== undefined) continue;
    const clause = m[2] ?? "";
    const braces = /\{([^}]*)\}/.exec(clause);
    // A default or namespace binding reaches past any one name.
    const whole = /\*\s*as/.test(clause) || /^[\w$]+\s*(,|$)/.test(clause.trim());
    imports.push({ spec: m[3] ?? "", names: whole ? "*" : bindings(braces?.[1] ?? "").map(b => b.from) });
  }
  for (const m of source.matchAll(IMPORT_BARE)) imports.push({ spec: m[1] ?? "", names: "*" });
  for (const m of source.matchAll(IMPORT_DYNAMIC)) {
    const literal = /^["']([^"']+)["']$/.exec(m[1] ?? "");
    // A computed specifier could load any file of the package: the walk would
    // under-report, so it refuses instead.
    if (literal === null) throw new Error(`${file}: dynamic import(${m[1]}) is not a string literal`);
    imports.push({ spec: literal[1] ?? "", names: "*" });
  }
  if (REQUIRE.test(source)) throw new Error(`${file}: require() of a package this walk follows`);
  const rest = source
    .replace(RE_EXPORT_NAMED, "")
    .replace(RE_EXPORT_STAR, "")
    .replace(/import\s*(type\s+)?[^"';]*?\s*from\s*["'][^"']+["']/g, "")
    .replace(/import\s*["'][^"']+["']/g, "")
    .replace(/[;\s]/g, "");
  return { reExports, imports, ownCode: rest !== "" };
}

function exportTarget(entry: unknown): string | null {
  if (typeof entry === "string") return entry;
  if (typeof entry !== "object" || entry === null) return null;
  for (const condition of ["import", "default"]) {
    const next = (entry as Record<string, unknown>)[condition];
    if (next !== undefined) return exportTarget(next);
  }
  return null;
}

function resolveSpec(root: string, from: string, spec: string): string | null {
  if (spec.startsWith(".")) {
    const base = resolve(dirname(from), spec);
    for (const candidate of [base, `${base}.js`, join(base, "index.js")]) {
      if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
    }
    throw new Error(`${from}: cannot resolve ${spec}`);
  }
  const pkg = PACKAGES.find(p => spec === p || spec.startsWith(`${p}/`));
  if (pkg === undefined) return null;
  const dir = join(root, "node_modules", pkg);
  const manifest: unknown = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  const exportsMap = (manifest as { exports?: Record<string, unknown> }).exports ?? {};
  const target = exportTarget(exportsMap[`.${spec.slice(pkg.length)}`]);
  if (target === null) throw new Error(`${from}: ${spec} is not in ${pkg}'s exports`);
  return join(dir, target);
}

function appSources(root: string): string[] {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap(e => {
      const path = join(dir, e.name);
      if (e.isDirectory()) return walk(path);
      return /\.(ts|tsx|mts)$/.test(e.name) ? [path] : [];
    });
  return [...APP_DIRS.flatMap(d => walk(join(root, d))), ...APP_FILES.map(f => join(root, f))];
}

/** The package files the app reaches, absolute, in no particular order. */
export function reachable(root: string): Set<string> {
  const taken = new Set<string>();
  const visited = new Set<string>();
  const ours = (file: string | null): file is string =>
    file !== null && PACKAGES.some(p => file.startsWith(join(root, "node_modules", p) + "/"));

  const visit = (file: string, names: Names): void => {
    const key = `${file}|${names === "*" ? "*" : [...names].sort().join(",")}`;
    if (visited.has(key)) return;
    visited.add(key);
    // Only scripts carry class literals; a stylesheet a module imports is
    // bundled as CSS, not scanned.
    if (!file.endsWith(".js")) return;
    const parsed = parse(file);
    if (parsed.ownCode && !taken.has(file)) {
      taken.add(file);
      for (const i of parsed.imports) {
        const target = resolveSpec(root, file, i.spec);
        if (ours(target)) visit(target, i.names);
      }
    }
    for (const r of parsed.reExports) {
      const target = resolveSpec(root, file, r.spec);
      if (!ours(target)) continue;
      if (r.namespace !== null) {
        if (names === "*" || names.includes(r.namespace)) visit(target, "*");
      } else if (r.names === null) {
        visit(target, names);
      } else {
        const wanted = r.names.filter(b => names === "*" || names.includes(b.as)).map(b => b.from);
        if (wanted.length > 0) visit(target, wanted);
      }
    }
  };

  for (const file of appSources(root)) {
    const parsed = parse(file);
    const edges: Import[] = [
      ...parsed.imports,
      ...parsed.reExports.map(r => ({ spec: r.spec, names: r.names === null ? ("*" as const) : r.names.map(b => b.from) })),
    ];
    for (const e of edges) {
      const target = PACKAGES.some(p => e.spec === p || e.spec.startsWith(`${p}/`)) ? resolveSpec(root, file, e.spec) : null;
      if (ours(target)) visit(target, e.names);
    }
  }
  return taken;
}

export function renderSources(root: string): string {
  const appDir = join(root, "app");
  const listed = [...reachable(root)].filter(f => LISTED.some(p => f.startsWith(join(root, "node_modules", p) + "/")));
  const lines = listed.map(f => relative(appDir, f)).sort();
  return [
    "/* GENERATED by scripts/css-sources.ts from the app's imports — do not edit by",
    " * hand; run `npm run css-sources` after bumping @evinvest/uikit, marketing or",
    " * kitstart, or importing something new of theirs. */",
    ...lines.map(l => `@source "${l}";`),
    "",
  ].join("\n");
}

function main() {
  const root = process.cwd();
  const expected = renderSources(root);
  const path = join(root, OUTPUT);
  if (process.argv.includes("--check")) {
    const current = existsSync(path) ? readFileSync(path, "utf8") : "";
    if (current !== expected) {
      console.error(`✘ ${OUTPUT} is stale: run \`npm run css-sources\``);
      process.exit(1);
    }
    console.log(`✔ ${OUTPUT} is current`);
    return;
  }
  writeFileSync(path, expected);
  console.log(`✔ ${OUTPUT}: ${expected.split("\n").filter(l => l.startsWith("@source")).length} files`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();

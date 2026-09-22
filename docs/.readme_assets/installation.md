The repo builds with Nix. Determinate Nix with `lazy-trees = true` is required.

```sh
nix develop
```

This gives you Node 22 (≥ 22.13, for `node:sqlite`), Playwright with its
pinned browsers, Typst and ImageMagick, and writes the generated files —
`.github/workflows/`, `.gitignore`, `.treefmt.toml` and this README — from
`flake.nix`. Edit the flake, not them.

Plain npm works for the app itself:

```sh
npm ci && npm run typecheck && npx eslint . && npx vitest run && npm run build && npm start
```

`vendor/evinvest/*.tgz` are unpublished builds of the EV lib packages
(`@evinvest/uikit`, `marketing`, `analytics`, `i18n`), installed as `file:`
dependencies. They are temporary: before the port merges they are replaced by
the same versions from npm, and the directory goes away.

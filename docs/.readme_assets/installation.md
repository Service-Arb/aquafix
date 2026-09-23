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

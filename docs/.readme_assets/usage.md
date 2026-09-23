Start the site:

```sh
nix run .#dev
```

A point is at `http://royat.localhost:59081/fr` (every `*.localhost` resolves
to your machine), the brand page at `http://localhost:59081/fr`.

Run the checks:

```sh
nix run .#test           # tsc, eslint, vitest, build, bundle budget, Playwright
nix run .#size           # first-load JS of a point page against tests/bundle_budget.txt
nix run .#figma-parity   # compares the card with the Figma export
nix flake check          # the hermetic Nix build, and the budget against it
```

The bundle budget is the one hard gate. Raising `tests/bundle_budget.txt` is a
deliberate commit that says why.

Build the server and the container image:

```sh
nix build                # the standalone server
nix build .#container    # OCI image, on Linux
```

The image listens on 59081 and keeps its leads in `/data/leads.db`; `/data` is
the mount. Its non-secret settings come from `deploy/config.nix`. Secrets —
`SMTP_URL`, `SMS_TOKEN`, `POSTHOG_KEY` — come only from the container's
environment. Pushing a `v*` tag builds the image and publishes it to
`ghcr.io/service-arb/aquafix`, which deploys it: `nix run .#publish` makes the
tag.

### Visual baselines

Screenshot baselines are Linux's, because CI is: a mac rasterises glyphs
differently, so locally the pixel comparison is skipped (`AQUAFIX_SNAPSHOTS=1`
shoots anyway, to look). To refresh them after changing a section:

1. Run the **Visual baselines** workflow on the branch
   (`gh workflow run visual-baselines.yml --ref <branch>`). Before that workflow
   exists on `main`, a CI run of **Errors** on the branch writes any missing
   baseline and publishes the same artifact.
2. `gh run download <run-id> -n visual-snapshots -D tests/e2e/__screenshots__`
3. Look at the images, then commit them alone:
   `test: refresh visual baselines (run <run-id>)`.

On Linux, `nix run .#accept-test` does the same locally; `-- <name>` for a subset.

`nix run .#help` prints the list of commands.

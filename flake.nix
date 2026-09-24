{
  nixConfig = {
    extra-substituters = [ "https://valeratrades.cachix.org" ];
    extra-trusted-public-keys = [ "valeratrades.cachix.org-1:gXVwhzO5YB+BaiEJYT48qZgzdaErGQew6xtZcz4Fo1Q=" ];
  };

  inputs = {
    v_flakes.url = "github:valeratrades/v_flakes?ref=v1.6";
  };

  outputs = { self, v_flakes }:
    let
      inherit (v_flakes) flake-utils pre-commit-hooks;
      manifest = builtins.fromJSON (builtins.readFile ./package.json);
      pname = manifest.name;
      brand = builtins.fromTOML (builtins.readFile ./assets/brand.toml);
      cardCopy = builtins.fromTOML (builtins.readFile ./assets/card.toml);
      # RFC 6350. TEL stays the printed text form: the E.164 one is not on the card,
      # and deriving it would be guessing a country code.
      vcard =
        lang:
        let
          v = builtins.replaceStrings [ "\\" ";" "," ] [ "\\\\" "\\;" "\\," ];
        in
        ''
          BEGIN:VCARD
          VERSION:4.0
          FN:${v cardCopy.name}
          ORG:${v (builtins.concatStringsSep "" brand.wordmark)}
          TITLE:${v cardCopy.langs.${lang}.role}
          TEL;VALUE=text;TYPE=work:${v cardCopy.phone}
          EMAIL;TYPE=work:${v cardCopy.email}
          URL:https://${v cardCopy.site}
          LANG:${lang}
          END:VCARD
        '';
    in
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import v_flakes.default_nixpkgs { inherit system; };
        lib = pkgs.lib;
        # `node:sqlite` without a flag needs ≥ 22.13 (package.json `engines`).
        # The build and the image run the same major; the image gets the slim
        # build, which is the same node without npm.
        nodejs = pkgs.nodejs_22;
        nodeRuntime = pkgs.nodejs-slim_22;

        # Single source for the dev server, the container's exposed port and the
        # prod env. The Rust server listened here too; the cluster's Service did
        # not have to change.
        sitePort = "59081";

        # ── the hermetic build ──────────────────────────────────────────────
        # `importNpmLock` fetches each package by the `integrity` the lockfile
        # already pins, so there is no second hash to keep in step with
        # package-lock.json, and nothing else reaches the network.
        npmLock = lib.importJSON ./package-lock.json;
        npmOs = if pkgs.stdenv.hostPlatform.isDarwin then "darwin" else "linux";
        npmCpu = if pkgs.stdenv.hostPlatform.isAarch64 then "arm64" else "x64";
        # npm's `os`/`cpu`/`libc` fields: a list of names, or of `!name` exclusions.
        fits = want: list:
          let positive = builtins.filter (x: !(lib.hasPrefix "!" x)) list;
          in !(builtins.elem "!${want}" list) && (positive == [ ] || builtins.elem want positive);
        foreign = m:
          (m ? os && !(fits npmOs m.os))
          || (m ? cpu && !(fits npmCpu m.cpu))
          || (m ? libc && !(fits "glibc" m.libc));
        npmSourceOverrides = lib.concatMapAttrs
          (path: m:
            # Every platform's native binary is in the lockfile — @next/swc
            # alone is ~100 MB per platform. npm skips the foreign ones without
            # reading them, so they are never fetched either.
            if (m.optional or false) && foreign m then
              { ${path} = pkgs.emptyFile; }
            else { })
          npmLock.packages;

        buildSrc = lib.fileset.toSource {
          root = ./.;
          fileset = lib.fileset.unions [
            ./package.json
            ./package-lock.json
            ./app
            ./src
            ./assets
            ./next.config.ts
            ./tsconfig.json
            ./postcss.config.mjs
            ./proxy.ts
            ./instrumentation.ts
          ];
        };

        # `.next/standalone` plus the static chunks `postbuild` copies into it:
        # the server and only the files it was traced to need. The diagnostics
        # ride along for the bundle-budget check; nothing serves them.
        site = pkgs.buildNpmPackage {
          inherit pname nodejs;
          version = manifest.version;
          src = buildSrc;
          npmDeps = pkgs.importNpmLock {
            npmRoot = ./.;
            packageSourceOverrides = npmSourceOverrides;
          };
          npmConfigHook = pkgs.importNpmLock.npmConfigHook;
          env.NEXT_TELEMETRY_DISABLED = "1";
          installPhase = ''
            runHook preInstall
            test -f .next/standalone/server.js
            test -d .next/standalone/.next/static
            test -f .next/standalone/assets/fonts/Archivo-Bold.ttf
            cp -a .next/standalone "$out"
            cp -a .next/diagnostics "$out/.next/diagnostics"
            runHook postInstall
          '';
          # The traced `node_modules` keep their bin shebangs; rewritten, each
          # would pull the full nodejs, npm included, into the image. Nothing in
          # the server executes them.
          dontPatchShebangs = true;
        };

        # Secret-free prod env, authored in nix and baked into the image.
        # Without it the server would take its dev defaults — see deploy/config.nix.
        prodEnv = import ./deploy/config.nix { port = sitePort; };
        containerStd = v_flakes.container.implement {
          inherit pkgs pname;
          containers."" = {
            port = lib.toInt sitePort;
            mounts = [ "/data" ];
            healthPath = "/health";
            # A down landing is a lost lead, not a stale chart.
            criticality = "high";
            entrypoint = [ "${nodeRuntime}/bin/node" "${site}/server.js" ];
            workingDir = "/data";
            imageEnv = [ "HOME=/data" ] ++ lib.mapAttrsToList (n: v: "${n}=${v}") prodEnv;
          };
        };

        # Print-ready: the card with bleed on and trim guide off, the A4 sheet as it
        # leaves an office printer. One set per language, the card's next to the
        # vCard carrying the same contact facts. The card is one polarity per face,
        # so it has no cut in its name; the sheet picks a surface and says which.
        brandMaterials =
          let
            src = lib.fileset.toSource {
              root = ./.;
              fileset = lib.fileset.unions [
                ./assets
                (lib.fileset.difference ./brand_materials ./brand_materials/tests)
              ];
            };
            cuts = [
              { material = "card"; polarity = "light"; explicit = false; name = "card"; }
              { material = "sheet"; polarity = "light"; explicit = false; name = "sheet.light"; }
              { material = "sheet"; polarity = "dark"; explicit = false; name = "sheet.dark"; }
              { material = "sheet"; polarity = "light"; explicit = true; name = "sheet.light.explicit"; }
              { material = "sheet"; polarity = "dark"; explicit = true; name = "sheet.dark.explicit"; }
            ];
          in
          pkgs.runCommand "aquafix-brand-materials" { nativeBuildInputs = [ pkgs.typst ]; } ''
            mkdir -p $out
            ${lib.concatMapStrings (lang: ''
              ${lib.concatMapStrings (cut: ''
                typst compile --root ${src} --ignore-system-fonts --font-path ${src}/assets/fonts \
                  --input lang=${lang} --input material=${cut.material} --input polarity=${cut.polarity} \
                  --input explicit=${lib.boolToString cut.explicit} \
                  ${src}/brand_materials/__main__.typ $out/${lang}-${cut.name}.pdf
              '') cuts}
              sed 's/$/\r/' ${pkgs.writeText "${lang}.vcf" (vcard lang)} > $out/${lang}.vcf
            '') (builtins.attrNames cardCopy.langs)}
          '';

        # The gate, on the hermetic build: `nix flake check` fails over budget.
        bundleBudget = pkgs.runCommand "aquafix-bundle-budget"
          {
            nativeBuildInputs = [ nodejs ];
            src = lib.fileset.toSource {
              root = ./.;
              fileset = lib.fileset.unions [ ./scripts/bundle-budget.ts ./tests/bundle_budget.txt ];
            };
          } ''
          cd "$src"
          node --experimental-strip-types --disable-warning=ExperimentalWarning scripts/bundle-budget.ts ${site}
          touch "$out"
        '';

        # ── apps ────────────────────────────────────────────────────────────
        # IMPORTANT: resolve the repo at *runtime* via `git rev-parse`, never
        # `toString ./.` — the latter pins the wrapper to the read-only
        # /nix/store snapshot, where npm cannot write.
        #
        # `npm ci` wipes node_modules, so it runs only when the lockfile moved.
        ensureDeps = ''
          stamp="node_modules/.aquafix-lock"
          want="$(sha256sum package-lock.json | cut -d' ' -f1)"
          if [ "$(cat "$stamp" 2>/dev/null)" != "$want" ]; then
            npm ci
            echo "$want" > "$stamp"
          fi
        '';
        # The spec's `@playwright/test` is the flake's, pinned with its browsers;
        # linked where tsc and the config resolve it from.
        linkPlaywright = ''
          ln -sfn ${pkgs.playwright-test}/lib/node_modules tests/e2e/node_modules
        '';

        runDev = pkgs.writeShellApplication {
          name = "run-dev";
          runtimeInputs = [ nodejs pkgs.git pkgs.coreutils ];
          text = ''
            cd "$(git rev-parse --show-toplevel)"
            ${ensureDeps}
            echo "  ▶ a point:  http://royat.localhost:${sitePort}/fr"
            echo "  ▶ the brand: http://localhost:${sitePort}/fr"
            exec npm run dev -- --port ${sitePort}
          '';
        };

        runTest = pkgs.writeShellApplication {
          name = "run-test";
          runtimeInputs = [ nodejs pkgs.git pkgs.coreutils pkgs.playwright-test ];
          text = ''
            cd "$(git rev-parse --show-toplevel)"
            ${ensureDeps}
            ${linkPlaywright}
            echo "▶ tsc";      npm run -s typecheck && npx tsc --noEmit -p tests/e2e
            echo "▶ eslint";   npx eslint .
            echo "▶ vitest";   npx vitest run
            echo "▶ build";    npm run -s build >/dev/null
            echo "▶ size";     npm run -s size
            echo "▶ playwright (1440 + 390)"
            playwright test -c tests/e2e "$@"
          '';
        };

        # Screenshot baselines are Linux's (CI's); a mac shoots different glyphs.
        runAcceptTest = pkgs.writeShellApplication {
          name = "accept-test";
          runtimeInputs = [ nodejs pkgs.git pkgs.coreutils pkgs.playwright-test ];
          text = ''
            if [ "$(uname -s)" != Linux ]; then
              echo "✘ baselines are Linux's. Take them from CI instead — README, \"Visual baselines\"." >&2
              exit 1
            fi
            cd "$(git rev-parse --show-toplevel)"
            ${ensureDeps}
            ${linkPlaywright}
            npm run -s build >/dev/null
            filter="''${1:-}"
            echo "▶ accepting screenshot baselines ''${filter:+for $filter}"
            playwright test -c tests/e2e --update-snapshots=all ''${filter:+-g "$filter"}
          '';
        };

        # Advisory, not a gate: it catches "the hero drifted two sections down",
        # never sub-pixel type rendering.
        runFigmaParity = pkgs.writeShellApplication {
          name = "figma-parity";
          runtimeInputs = with pkgs; [ git typst imagemagick ];
          text = ''
            repo="$(git rev-parse --show-toplevel)"
            cd "$repo/brand_materials" && ./tests/figma_parity.sh
          '';
        };

        # The one number worth gating: our visitor is on mobile data mid-emergency.
        runSize = pkgs.writeShellApplication {
          name = "bundle-size";
          runtimeInputs = [ nodejs pkgs.git pkgs.coreutils ];
          text = ''
            cd "$(git rev-parse --show-toplevel)"
            ${ensureDeps}
            npm run -s build >/dev/null
            npm run -s size
          '';
        };

        # ── bump the latest remote vX.Y.Z tag and push: `.#publish major|minor|patch [note]` ──
        # Ported from site_conductor. The version lives in the tag, not in a
        # file: package.json carries its own and the two need not agree, so
        # nothing here writes to it — that would be a second source for one number.
        # The tag is the release: `release-container.yml` ships the image on it.
        runPublish = pkgs.writeShellApplication {
          name = "publish";
          runtimeInputs = with pkgs; [ git ];
          text = ''
            part="''${1:-}"
            case "$part" in
              major | minor | patch) ;;
              *) echo "usage: nix run .#publish -- major|minor|patch [release note]" >&2; exit 1 ;;
            esac
            [ -z "$(git status --porcelain)" ] || { echo "uncommitted changes — commit or stash first" >&2; exit 1; }
            # Everything after the bump part is the note, so
            # `.#publish patch "fixed the thing"` needs no quoting gymnastics.
            shift
            note="$*"

            # Not silenced: computing the next version from a stale tag list is
            # how a release number gets reused, so a failed fetch must be loud.
            git fetch --tags --force origin >/dev/null
            last="$(git tag -l 'v*' --sort=-v:refname | head -n1)"
            ver="''${last#v}"; [ -n "$ver" ] || ver="0.0.0"
            ma="''${ver%%.*}"; rest="''${ver#*.}"; mi="''${rest%%.*}"; pa="''${rest##*.}"
            case "$part" in
              major) ma=$((ma + 1)); mi=0; pa=0 ;;
              minor) mi=$((mi + 1)); pa=0 ;;
              patch) pa=$((pa + 1)) ;;
            esac
            next="v$ma.$mi.$pa"
            echo "''${last:-<no tag>} → $next"

            # Annotated (-a), never lightweight. `git describe` prefers annotated
            # tags, and a lightweight one has nowhere to put a release note at
            # all. In lib, `push --follow-tags` silently refused to send
            # lightweight tags and those releases simply never appeared.
            if [ -n "$note" ]; then
              printf '%s\n\n%s\n' "$next" "$note" | git tag -a "$next" -F -
            else
              git tag -a "$next" -m "$next"
            fi
            # Named explicitly rather than --follow-tags, and the push fires the
            # pre-push hook, so `.#test` gates the release.
            git push origin "$next"
          '';
        };

        runHelp = pkgs.writeShellApplication {
          name = "help";
          text = ''
            cat <<'EOF'
              nix run .#dev            next dev on ${sitePort} (royat.localhost for a point)
              nix run .#test           tsc, eslint, vitest, build, size, playwright   [pre-push hook]
              nix run .#accept-test    accept screenshot baselines (Linux only); `-- <name>` for a subset
              nix run .#size           build, then the first-load JS budget          [the one hard gate]
              nix run .#figma-parity   blur-diff against the Figma export            [advisory]
              nix run .#publish        bump the latest remote tag: major|minor|patch [note] — the tag ships
              nix build                the standalone server (.next/standalone)
              nix build .#container    OCI image (Linux)
              nix build .#brand-materials  print -> result/<lang>-{card,sheet.{light,dark}[.explicit]}.pdf + <lang>.vcf
              nix run .#generate       rewrite workflows, .gitignore, .treefmt.toml, README (the devShell does too)
              nix flake check          the hermetic build + the bundle budget against it
            EOF
          '';
        };

        # ── generated repo files ────────────────────────────────────────────
        # `.github/workflows/*`, `.gitignore`, `.treefmt.toml` and README.md are
        # written by the devShell from here; edit this file, not them.
        workflows = import ./nix/workflows.nix { inherit pkgs; };
        # v_flakes' own generators for what is not language-specific: the
        # container release on a `v*` tag, the LoC badge and the Claude review.
        # Its `github` module would add Rust jobs and require a Rust toolchain.
        sharedWorkflows = v_flakes.workflows {
          inherit pkgs pname;
          jobsErrors = [ ];
          jobsWarnings = [ ];
          jobsOther = [ "loc-badge" ];
          containerRelease = { registry = "ghcr.io/service-arb"; };
          claude = true;
        };
        gitignore = v_flakes.files.gitignore {
          inherit pkgs;
          langs = [ "js" ];
          extra = ''
            next-env.d.ts
            /data/
            # A symlink to the flake-pinned @playwright/test, so no trailing slash.
            tests/e2e/node_modules
            # Playwright failure artefacts. The baselines under
            # tests/e2e/__screenshots__/ are tracked; these are not.
            **/test-results/
            **/playwright-report/'';
        };
        treefmt = (pkgs.formats.toml { }).generate "treefmt.toml" {
          global.excludes = [ "docs/refs/**" ];
          formatter = {
            nix = { command = "nixpkgs-fmt"; includes = [ "*.nix" ]; };
            typst = { command = "typstyle"; options = [ "-i" "--line-width" "190" "--indent-width" "2" ]; includes = [ "*.typ" ]; };
          };
        };
        readme = v_flakes.readme-fw {
          inherit pkgs pname;
          defaults = true;
          lastSupportedVersion = null;
          rootDir = ./.;
          badges = [ "loc" "ci" ];
        };
        generateRepoFiles = ''
          mkdir -p .github/workflows
          ${v_flakes.utils.unwrapShellHook sharedWorkflows.shellHook}
          ${workflows.shellHook}
          cp -f ${gitignore} ./.gitignore
          cp -f ${treefmt} ./.treefmt.toml
          ${v_flakes.utils.unwrapShellHook readme.shellHook}
        '';

        # The same writes without entering the shell (and without its hook installs).
        runGenerate = pkgs.writeShellApplication {
          name = "generate";
          runtimeInputs = with pkgs; [ git coreutils gnused gnugrep ];
          text = ''
            cd "$(git rev-parse --show-toplevel)"
            ${generateRepoFiles}
          '';
        };

        # `.#test` on pre-push, not pre-commit: a full run per commit is too slow
        # to survive contact with actual work.
        preCommitBase = v_flakes.files.preCommit { inherit pkgs; };
        pre-commit-check = pre-commit-hooks.lib.${system}.run (preCommitBase // {
          hooks = preCommitBase.hooks // {
            treefmt = preCommitBase.hooks.treefmt // {
              settings = preCommitBase.hooks.treefmt.settings // {
                formatters = [ pkgs.nixpkgs-fmt pkgs.typstyle ];
              };
            };
            test = {
              enable = true;
              name = "nix run .#test";
              entry = "${runTest}/bin/run-test";
              pass_filenames = false;
              stages = [ "pre-push" ];
            };
          };
        });
      in
      {
        apps = {
          default = { type = "app"; program = "${runDev}/bin/run-dev"; };
          dev = { type = "app"; program = "${runDev}/bin/run-dev"; };
          test = { type = "app"; program = "${runTest}/bin/run-test"; };
          accept-test = { type = "app"; program = "${runAcceptTest}/bin/accept-test"; };
          figma-parity = { type = "app"; program = "${runFigmaParity}/bin/figma-parity"; };
          size = { type = "app"; program = "${runSize}/bin/bundle-size"; };
          publish = { type = "app"; program = "${runPublish}/bin/publish"; };
          help = { type = "app"; program = "${runHelp}/bin/help"; };
          generate = { type = "app"; program = "${runGenerate}/bin/generate"; };
        };

        packages = {
          default = site;
          site = site;
          container = containerStd.packages."${pname}-container";
          brand-materials = brandMaterials;
        } // containerStd.packages;

        containers = containerStd.containers;

        checks = {
          inherit site;
          bundle-budget = bundleBudget;
        };

        devShells.default = pkgs.mkShell {
          shellHook = pre-commit-check.shellHook + ''
            # Generated files are written only from the repo root, and never in
            # CI, where the checkout is the thing under test.
            if [ -z "''${CI:-}" ] && [ "$PWD" = "$(git rev-parse --show-toplevel 2>/dev/null)" ]; then
              ${generateRepoFiles}
            fi
          '';

          packages = [
            nodejs
            # runner + nixpkgs-pinned browsers; its wrapper exports NODE_PATH and
            # PLAYWRIGHT_BROWSERS_PATH. `nix run .#test` links it for tsc.
            pkgs.playwright-test
            pkgs.sqlite # inspecting the lead store
            # brand_materials/
            pkgs.typst
            pkgs.typstyle
            pkgs.imagemagick
            pkgs.treefmt
            pkgs.nixpkgs-fmt
          ] ++ pre-commit-check.enabledPackages ++ readme.enabledPackages;

          env.PORT = sitePort;
          env.NEXT_TELEMETRY_DISABLED = "1";
          env.E2E_PLAYWRIGHT_MODULES = "${pkgs.playwright-test}/lib/node_modules";
        };
      }
    );
}

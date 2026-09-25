{
  nixConfig = {
    extra-substituters = [ "https://valeratrades.cachix.org" ];
    extra-trusted-public-keys = [ "valeratrades.cachix.org-1:gXVwhzO5YB+BaiEJYT48qZgzdaErGQew6xtZcz4Fo1Q=" ];
  };

  inputs = {
    v_flakes.url = "github:valeratrades/v_flakes?ref=v1.6";
    # The lib flake at the tag of the @evinvest/kitstart version in
    # package-lock.json — mkLanding refuses a mismatch.
    ev.url = "github:EV-invest/lib?ref=@evinvest/kitstart-v0.4.0";
    ev.inputs.v_flakes.follows = "v_flakes";
  };

  # The landing machinery (hermetic build, image, bundle budget, container
  # smoke, dev and test apps) is the lib's `mkLanding`; what stays here is
  # Aquafix's config, the print materials, the generated repo files and the
  # release tag.
  outputs = { self, v_flakes, ev }:
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

        # Single source for the dev server, the container's exposed port and the
        # prod env. The Rust server listened here too; the cluster's Service did
        # not have to change. (vifnet is on 59082.)
        sitePort = "59081";
        # Secret-free prod env, authored in nix and baked into the image.
        # Without it the server would take its dev defaults — see deploy/config.nix.
        prodEnv = import ./deploy/config.nix { port = sitePort; };

        landing = ev.lib.mkLanding {
          inherit pkgs v_flakes pname sitePort prodEnv;
          root = ./.;
          buildFiles = [
            "package.json"
            "package-lock.json"
            "app"
            "src"
            "assets"
            "next.config.ts"
            "tsconfig.json"
            "postcss.config.mjs"
            "proxy.ts"
            "instrumentation.ts"
          ];
          # The OG card sets type in these; tracing cannot infer a path read at run time.
          requiredFiles = [ "assets/fonts/Archivo-Bold.ttf" "assets/fonts/Inter-Medium.ttf" ];
          # A point on its own host, its OG card, and a person's quote landing in /data.
          smoke = {
            page = "/fr";
            host = "royat.aquafix.top";
            og = "/og?l=royat";
            quote = { location = "royat"; job = "blocked_drain"; zip = "63130"; mobile = "0612345678"; };
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
              nix run .#dev              next dev on ${sitePort} (royat.localhost:${sitePort}/fr for a point)
              nix run .#test             tsc, eslint, vitest, build, size, playwright   [pre-push hook]
              nix run .#accept-test      accept screenshot baselines (Linux only); `-- <name>` for a subset
              nix run .#size             build, then the first-load JS budget          [the one hard gate]
              nix run .#container-smoke  boot the image and hold it to its contract    (Linux + docker)
              nix run .#figma-parity     blur-diff against the Figma export            [advisory]
              nix run .#publish          bump the latest remote tag: major|minor|patch [note] — the tag ships
              nix build                  the standalone server (.next/standalone)
              nix build .#container      OCI image (Linux)
              nix build .#brand-materials  print -> result/<lang>-{card,sheet.{light,dark}[.explicit]}.pdf + <lang>.vcf
              nix run .#generate         rewrite workflows, .gitignore, .treefmt.toml, README (the devShell does too)
              nix flake check            the hermetic build + the bundle budget against it
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
              entry = landing.apps.test.program;
              pass_filenames = false;
              stages = [ "pre-push" ];
            };
          };
        });
      in
      {
        apps = landing.apps // {
          default = landing.apps.dev;
          help = { type = "app"; program = "${runHelp}/bin/help"; };
          figma-parity = { type = "app"; program = "${runFigmaParity}/bin/figma-parity"; };
          publish = { type = "app"; program = "${runPublish}/bin/publish"; };
          generate = { type = "app"; program = "${runGenerate}/bin/generate"; };
        };

        packages = landing.packages // {
          brand-materials = brandMaterials;
        };

        inherit (landing) containers checks;

        devShells.default = landing.devShell.overrideAttrs (old: {
          shellHook = (old.shellHook or "") + pre-commit-check.shellHook + ''
            # Generated files are written only from the repo root, and never in
            # CI, where the checkout is the thing under test.
            if [ -z "''${CI:-}" ] && [ "$PWD" = "$(git rev-parse --show-toplevel 2>/dev/null)" ]; then
              ${generateRepoFiles}
            fi
          '';
          nativeBuildInputs = (old.nativeBuildInputs or [ ]) ++ [
            # brand_materials/
            pkgs.typst
            pkgs.typstyle
            pkgs.imagemagick
            pkgs.treefmt
            pkgs.nixpkgs-fmt
          ] ++ pre-commit-check.enabledPackages ++ readme.enabledPackages;
          # Where CI links the flake's `@playwright/test` for the e2e specs' tsc.
          E2E_PLAYWRIGHT_MODULES = "${pkgs.playwright-test}/lib/node_modules";
        });
      }
    );
}

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
      manifest = (builtins.fromTOML (builtins.readFile ./aquafix/Cargo.toml)).package;
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
        rust = v_flakes.rs.default_nightly system;
        # mold is Linux-only — the adapter throws at *eval* time on Darwin, which
        # would break every target on a mac, not just the ones that link.
        stdenv = if pkgs.stdenv.isDarwin then pkgs.stdenv else pkgs.stdenvAdapters.useMoldLinker pkgs.stdenv;

        # rust-lld embeds a bad rpath on macOS: it looks for libLLVM.dylib in
        # bin/../lib but nix puts it in <rust>/lib, so a wasm link aborts.
        dyldFallback = pkgs.lib.optionalString pkgs.stdenv.isDarwin
          ''export DYLD_FALLBACK_LIBRARY_PATH="${rust}/lib''${DYLD_FALLBACK_LIBRARY_PATH:+:$DYLD_FALLBACK_LIBRARY_PATH}"'';

        # Single source for the `dx serve` bind, the container's exposed port and
        # the devShell env. Matches `config::AppConfig::socket_addr`'s default.
        sitePort = "59081";

        # Pinned to the workspace's `wasm-bindgen` (`=0.2.125`): nixpkgs ships a
        # different minor and a CLI/crate schema skew is a hard error at bindgen
        # time. Shadows `pkgs.wasm-bindgen-cli` wherever referenced below.
        wasm-bindgen-cli =
          let
            src = pkgs.fetchCrate {
              pname = "wasm-bindgen-cli";
              version = "0.2.125";
              hash = "sha256-zRawtjxMOdTMX+mZaiNR3YYfTiZJhf9qj7kXSSeMxrc=";
            };
          in
          pkgs.buildWasmBindgenCli {
            inherit src;
            cargoDeps = pkgs.rustPlatform.fetchCargoVendor {
              inherit src;
              inherit (src) pname version;
              hash = "sha256-aZCfgR23Qb0Pn4Mm4ToMtuuRQqSJjXCR9li/VvP5CTM=";
            };
          };

        # ── dev ─────────────────────────────────────────────────────────────
        # IMPORTANT: resolve the repo at *runtime* via `git rev-parse`, never
        # `toString ./.` — the latter pins the wrapper to the read-only
        # /nix/store snapshot, where neither cargo nor tailwind can write.
        runDev = pkgs.writeShellApplication {
          name = "run-dev";
          runtimeInputs = with pkgs; [ rust dioxus-cli tailwindcss_4 git ];
          text = ''
            repo="$(git rev-parse --show-toplevel)"
            cd "$repo/aquafix"

            # build.rs derives every generated asset, tailwind.css included, so
            # the one-shot build is already covered — this watcher only picks up
            # class edits between cargo rebuilds.
            tailwindcss -i ./input.css -o ./assets/tailwind.css --watch & css=$!
            trap 'kill "$css" 2>/dev/null || true' EXIT INT TERM

            cd "$repo"
            # Reap a server orphaned by a previous run: dx does not always
            # propagate SIGINT to its spawned child, which then holds the port.
            pkill -f 'target/dx/aquafix/.*/server-' 2>/dev/null || true
            echo "  ▶ serving on http://127.0.0.1:${sitePort}"
            # RUSTFLAGS *replaces* `[target.*].rustflags`, it does not merge — so
            # this keeps the correctness cfgs and drops the two flags dx cannot
            # tolerate: `-fuse-ld=mold` (dx intercepts linking with its own shim)
            # and `-Z threads` (ICEs its incremental build). `cargo b` and
            # `nix build` still read the config and keep both.
            export RUSTFLAGS='--cfg tokio_unstable --cfg web_sys_unstable_apis'
            # No `exec`: keep this shell as the parent so the trap reaps tailwind.
            # `--interactive false` is deliberately absent — TUI mode setsids, and
            # that detachment is what lets dx survive fish's ctrl-c.
            nix develop "$repo" --command dx serve --package aquafix --port ${sitePort}
          '';
        };

        # ── tests ───────────────────────────────────────────────────────────
        # Delegates to `nix develop` so cargo gets the devShell toolchain (the
        # `.cargo` sccache/cranelift/mold accelerators a bare app PATH lacks).
        runTest = pkgs.writeShellApplication {
          name = "run-test";
          runtimeInputs = with pkgs; [ git ];
          text = ''
            repo="$(git rev-parse --show-toplevel)"
            echo "▶ cargo test (insta snapshots)"
            nix develop "$repo" --command cargo test
            echo "▶ playwright (1440 + 390)"
            nix develop "$repo" --command bash -c 'cd aquafix && playwright test'
          '';
        };

        runAcceptTest = pkgs.writeShellApplication {
          name = "accept-test";
          runtimeInputs = with pkgs; [ git ];
          text = ''
            repo="$(git rev-parse --show-toplevel)"
            filter="''${1:-}"
            echo "▶ accepting insta snapshots"
            nix develop "$repo" --command cargo insta accept
            echo "▶ accepting screenshot baselines ''${filter:+for $filter}"
            # The quotes are for the inner bash; the expansion is this shell's.
            # shellcheck disable=SC2016
            nix develop "$repo" --command bash -c \
              "cd aquafix && playwright test --update-snapshots ''${filter:+-g '$filter'}"
          '';
        };

        # Advisory, not a gate: it catches "the hero drifted two sections down",
        # never sub-pixel type rendering.
        runFigmaParity = pkgs.writeShellApplication {
          name = "figma-parity";
          runtimeInputs = with pkgs; [ git typst imagemagick ];
          text = ''
            repo="$(git rev-parse --show-toplevel)"
            cd "$repo/business_card" && ./tests/figma_parity.sh
          '';
        };

        # The one number worth gating: our visitor is on mobile data mid-emergency.
        runSize = pkgs.writeShellApplication {
          name = "wasm-size";
          runtimeInputs = with pkgs; [ git coreutils findutils ];
          text = ''
            repo="$(git rev-parse --show-toplevel)"
            # The file is commented; the budget is the last line.
            budget="$(tail -1 "$repo/aquafix/tests/wasm_budget.txt" | tr -dc '0-9')"
            wasm="$(find "$repo/target/dx/aquafix/release/web/public" -name '*_bg*.wasm' 2>/dev/null | head -1)"
            if [ -z "$wasm" ]; then
              echo "✘ no release wasm — run 'nix build .#dx' first" >&2
              exit 1
            fi
            actual="$(stat -c %s "$wasm")"
            printf '  wasm %s KB / budget %s KB\n' "$((actual / 1024))" "$((budget / 1024))"
            if [ "$actual" -gt "$budget" ]; then
              echo "✘ over budget. Raising aquafix/tests/wasm_budget.txt is a deliberate commit, with a reason." >&2
              exit 1
            fi
          '';
        };

        runHelp = pkgs.writeShellApplication {
          name = "help";
          text = ''
            cat <<'EOF'
              nix run .#dev            tailwind --watch + dx serve on ${sitePort}
              nix run .#test           cargo test (insta) + playwright     [pre-push hook]
              nix run .#accept-test    accept baselines; `-- <name>` for a subset
              nix run .#figma-parity   blur-diff against the Figma export  [advisory]
              nix run .#size           wasm budget check (after `nix build .#dx`)
              nix build .#dx           release server + public/
              nix build .#${pname}-container   OCI image
              nix build .#card         business card -> result/<lang>.{pdf,vcf}
            EOF
          '';
        };

        # `.#test` on pre-push, not pre-commit: a full run per commit is too slow
        # to survive contact with actual work.
        preCommitBase = v_flakes.files.preCommit { inherit pkgs; };
        pre-commit-check = pre-commit-hooks.lib.${system}.run (preCommitBase // {
          hooks = preCommitBase.hooks // {
            test = {
              enable = true;
              name = "nix run .#test";
              entry = "${runTest}/bin/run-test";
              pass_filenames = false;
              stages = [ "pre-push" ];
            };
          };
        });

        rs = v_flakes.rs {
          inherit pkgs rust;
          build = {
            deny = false;
            workspace = let deprecate_by = "v1.0.0"; in {
              "./aquafix/" = [ "git_version" "log_directives" { deprecate = { by_version = deprecate_by; force = true; }; } ];
            };
          };
        };
        github = v_flakes.github {
          inherit pkgs pname rs;
          enable = true;
          lastSupportedVersion = "nightly-2026-09-03";
          jobs.default = true;
          gitignore.extra = ''
            **/node_modules/
            # Derived from the repo-root assets/ by aquafix/assets.rs + tailwind.
            aquafix/assets/
            /data/
            # Playwright failure artefacts. The baselines under
            # aquafix/tests/__screenshots__/ are tracked; these are not.
            **/test-results/
            **/playwright-report/
          '';
        };
        readme = v_flakes.readme-fw {
          inherit pkgs pname;
          defaults = true;
          lastSupportedVersion = "nightly-1.100";
          rootDir = ./.;
          badges = [ "msrv" "crates_io" "docs_rs" "loc" "ci" ];
        };
        combined = v_flakes.utils.combine { inherit rust; modules = [ rs github readme ]; };
      in
      let
        rustc = rust;
        cargo = rust;
        rustPlatform = pkgs.makeRustPlatform { inherit rustc cargo stdenv; };

        # `.cargo` holds dev-only accelerators (sccache rustc-wrapper, cranelift,
        # mold) the hermetic sandbox lacks — drop it so the pure build uses nix's
        # own toolchain instead of failing on a missing `sccache` on PATH.
        pureSrc = pkgs.lib.cleanSourceWith {
          src = ./.;
          filter = path: _type: baseNameOf path != ".cargo";
        };

        # Print-ready: bleed on, trim guide off. Both pages, one file per language,
        # each next to the vCard carrying the same contact facts.
        cardPdf =
          let
            src = pkgs.lib.fileset.toSource {
              root = ./.;
              fileset = pkgs.lib.fileset.unions [
                ./assets
                (pkgs.lib.fileset.difference ./business_card ./business_card/tests)
              ];
            };
          in
          pkgs.runCommand "aquafix-card" { nativeBuildInputs = [ pkgs.typst ]; } ''
            mkdir -p $out
            ${pkgs.lib.concatMapStrings (lang: ''
              typst compile --root ${src} --ignore-system-fonts --font-path ${src}/assets/fonts \
                --input lang=${lang} ${src}/business_card/__main__.typ $out/${lang}.pdf
              sed 's/$/\r/' ${pkgs.writeText "${lang}.vcf" (vcard lang)} > $out/${lang}.vcf
            '') (builtins.attrNames cardCopy.langs)}
          '';

        siteBin = rustPlatform.buildRustPackage {
          inherit pname;
          version = manifest.version;
          src = pureSrc;
          cargoLock.lockFile = ./Cargo.lock;
          buildInputs = with pkgs; [ openssl.dev sqlite ];
          # tailwindcss is for build.rs, which derives every generated asset.
          nativeBuildInputs = with pkgs; [ pkg-config tailwindcss_4 ];
          # Dioxus fullstack resolves `public/` by the binary's *realpath*, so a
          # buildEnv symlink does not work — it must be in the same store path.
          postInstall = "mkdir -p $out/bin/public";
          doCheck = false;
        };

        # `NO_DOWNLOADS=1` flips dx 0.7's `prefer_no_downloads()`, so its
        # wasm-opt/wasm-bindgen stages resolve binaries via `which` off PATH
        # (binaryen 129 matches dx's pinned BINARYEN_VERSION; wasm-bindgen-cli
        # =0.2.125 passes its exact-version check) instead of fetching — which is
        # what makes a hermetic build possible at all.
        siteDxBuild = rustPlatform.buildRustPackage {
          pname = "${pname}-dx";
          version = manifest.version;
          src = pureSrc;
          cargoLock.lockFile = ./Cargo.lock;

          buildInputs = with pkgs; [ openssl.dev sqlite ];
          nativeBuildInputs = with pkgs; [
            pkg-config
            dioxus-cli
            wasm-bindgen-cli
            binaryen
            tailwindcss_4
            removeReferencesTo
          ] ++ pkgs.lib.optionals (!pkgs.stdenv.isDarwin) [ pkgs.mold ];

          AQUAFIX_BUILD_REV = self.shortRev or self.dirtyShortRev or "";

          buildPhase = ''
            runHook preBuild
            ${dyldFallback}
            export NO_DOWNLOADS=1
            # `-C strip=debuginfo` is prod-only: dx forces DWARF into the release
            # wasm, which wasm-opt's binary writer aborts on. Stripping fixes the
            # abort and roughly halves the bundle.
            export RUSTFLAGS="--cfg tokio_unstable --cfg web_sys_unstable_apis -C strip=debuginfo"
            ( cd aquafix && dx build --release --package aquafix )
            runHook postBuild
          '';

          installPhase = ''
            runHook preInstall
            web="target/dx/aquafix/release/web"
            test -x "$web/server"
            test -f "$web/public/index.html"
            mkdir -p "$out/bin"
            cp -a "$web/server" "$out/bin/aquafix"
            cp -a "$web/public" "$out/bin/public"
            # The binary and the wasm bake the nightly std source path into
            # `#[track_caller]` panic strings — pure data never opened at runtime,
            # but nix's reference scanner sees it and dockerTools would drag the
            # whole toolchain in. Scrubbing it is worth ~2.3 GB of image.
            chmod -R u+w "$out/bin"
            remove-references-to -t ${rust} "$out/bin/aquafix"
            find "$out/bin/public" -name '*.wasm' -exec remove-references-to -t ${rust} {} +
            runHook postInstall
          '';
          doCheck = false;
        };

        # Secret-free prod config baked into the image. Authored in nix and
        # evaluated to JSON here, because the container has no `nix`. Without an
        # explicit `--config` the binary searches only XDG dirs and the
        # `AQUAFIX_*` env namespace, so it would silently boot on dev defaults —
        # a 127.0.0.1 bind that fails the k8s probe, and leads written somewhere
        # that is not the mounted volume.
        prodConfig = pkgs.writeText "config.json" (builtins.toJSON (import ./deploy/config.nix { port = sitePort; }));
        containerStd = v_flakes.container.implement {
          inherit pkgs pname;
          containers."" = {
            port = pkgs.lib.toInt sitePort;
            mounts = [ "/data" ];
            healthPath = "/health";
            # A down landing is a lost lead, not a stale chart.
            criticality = "high";
            entrypoint = [ "${siteDxBuild}/bin/aquafix" "--config" "${prodConfig}" ];
            workingDir = "/data";
            imageEnv = [ "HOME=/data" ];
          };
        };
      in
      {
        apps = {
          default = { type = "app"; program = "${runDev}/bin/run-dev"; };
          dev = { type = "app"; program = "${runDev}/bin/run-dev"; };
          test = { type = "app"; program = "${runTest}/bin/run-test"; };
          accept-test = { type = "app"; program = "${runAcceptTest}/bin/accept-test"; };
          figma-parity = { type = "app"; program = "${runFigmaParity}/bin/figma-parity"; };
          size = { type = "app"; program = "${runSize}/bin/wasm-size"; };
          help = { type = "app"; program = "${runHelp}/bin/help"; };
        };

        packages = {
          default = siteBin;
          bin = siteBin;
          dx = siteDxBuild;
          card = cardPdf;
        } // containerStd.packages;

        containers = containerStd.containers;

        devShells.default =
          with pkgs;
          mkShell {
            inherit stdenv;
            shellHook =
              pre-commit-check.shellHook
              + combined.shellHook
              + ''
                cp -f ${(v_flakes.files.treefmt) { inherit pkgs; }} ./.treefmt.toml
                # Everything under aquafix/assets/ is derived by build.rs; there
                # is nothing to stage here.
                ${dyldFallback}
              '';

            packages = [
              mold
              openssl
              pkg-config
              rust
              dioxus-cli # `dx serve` / `dx build`
              tailwindcss_4 # standalone Tailwind v4 CLI
              wasm-bindgen-cli # must match wasm-bindgen =0.2.125
              # runner + nixpkgs-pinned browsers; its wrapper exports NODE_PATH,
              # which is what resolves `@playwright/test` from playwright.config.ts.
              playwright-test
              sqlite # inspecting the lead store
              # business_card/
              typst
              imagemagick
            ] ++ pre-commit-check.enabledPackages ++ combined.enabledPackages;

            env.RUST_BACKTRACE = 1;
            env.RUST_LIB_BACKTRACE = 0;
            env.SITE_PORT = sitePort;
          };
      }
    );
}

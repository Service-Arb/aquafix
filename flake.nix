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
        pre-commit-check = pre-commit-hooks.lib.${system}.run (v_flakes.files.preCommit { inherit pkgs; });
        stdenv = pkgs.stdenvAdapters.useMoldLinker pkgs.stdenv;

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
      {
        packages =
          let
            rustc = rust;
            cargo = rust;
            rustPlatform = pkgs.makeRustPlatform {
              inherit rustc cargo stdenv;
            };
          in
          {
            default = rustPlatform.buildRustPackage {
              inherit pname;
              version = manifest.version;

              buildInputs = with pkgs; [
                openssl.dev
              ];
              nativeBuildInputs = with pkgs; [ pkg-config ];

              cargoLock.lockFile = ./Cargo.lock;
              src = pkgs.lib.cleanSource ./.;
            };

            # Print-ready: bleed on, trim guide off. Both pages, one file per language.
            card =
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
          };

        devShells.default =
          with pkgs;
          mkShell {
            inherit stdenv;
            shellHook =
              pre-commit-check.shellHook
              + combined.shellHook
              + ''
                cp -f ${(v_flakes.files.treefmt) { inherit pkgs; }} ./.treefmt.toml
              '';

            packages = [
              mold
              openssl
              pkg-config
              rust
              # business_card/
              typst
              imagemagick
            ] ++ pre-commit-check.enabledPackages ++ combined.enabledPackages;

            env.RUST_BACKTRACE = 1;
            env.RUST_LIB_BACKTRACE = 0;
          };
      }
    );
}

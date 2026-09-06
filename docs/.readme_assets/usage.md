Start the site:

```sh
nix run .#dev
```

The page is at `http://127.0.0.1:59081`.

Run the checks:

```sh
nix run .#test           # HTML snapshots, then screenshots at both breakpoints
nix run .#size           # WebAssembly size against the committed budget
nix run .#figma-parity   # compares the card with the Figma export
```

Accept new baselines after you change a section:

```sh
nix run .#accept-test
```

Build the release server and the container image:

```sh
nix build .#dx
nix build .#container
```

`nix run .#help` prints this list.

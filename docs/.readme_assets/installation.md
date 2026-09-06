The repo builds with Nix. Determinate Nix with `lazy-trees = true` is required.

```sh
nix develop
```

This gives you the Rust toolchain, `dx`, the Tailwind CLI, Typst and
ImageMagick. The build derives everything under `aquafix/assets/` from
`assets/`, so there is no separate asset step.

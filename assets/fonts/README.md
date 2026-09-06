Static instances cut from the Google Fonts variable masters. Typst 0.14 does not
instance variable fonts, so weights had to be frozen ahead of time; the design
also needs Archivo pinned to `wdth 100`. The `.woff2` twins are what the site
`@font-face`s; the `.ttf` originals are what typst renders the card from.

```sh
gf=$(nix build --no-link --print-out-paths nixpkgs#google-fonts)/share/fonts/truetype
for w in 600:SemiBold 700:Bold; do
  fonttools varLib.instancer -o "Archivo-${w#*:}.ttf" "$gf/Archivo[wdth,wght].ttf" wdth=100 wght=${w%%:*}
done
for w in 400:Regular 500:Medium 600:SemiBold; do
  fonttools varLib.instancer -o "Inter-${w#*:}.ttf" "$gf/Inter[opsz,wght].ttf" opsz=14 wght=${w%%:*}
done
for f in *.ttf; do fonttools ttLib.woff2 compress -o "${f%.ttf}.woff2" "$f"; done
```

Archivo © The Archivo Project Authors, Inter © The Inter Project Authors, both
under the SIL Open Font License 1.1 ([OFL.txt](OFL.txt)).

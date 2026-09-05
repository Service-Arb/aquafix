Static instances cut from the Google Fonts variable masters. Typst 0.14 does not
instance variable fonts, so weights had to be frozen ahead of time; the design
also needs Archivo pinned to `wdth 100`.

```sh
gf=$(nix build --no-link --print-out-paths nixpkgs#google-fonts)/share/fonts/truetype
fonttools varLib.instancer -o Archivo-Bold.ttf "$gf/Archivo[wdth,wght].ttf" wdth=100 wght=700
for w in 400:Regular 500:Medium 600:SemiBold; do
  fonttools varLib.instancer -o "Inter-${w#*:}.ttf" "$gf/Inter[opsz,wght].ttf" opsz=14 wght=${w%%:*}
done
```

Archivo © The Archivo Project Authors, Inter © The Inter Project Authors, both
under the SIL Open Font License 1.1 ([OFL.txt](OFL.txt)).

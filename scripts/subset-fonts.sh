#!/usr/bin/env bash
# Rebuilds the web `.woff2` twins from the print `.ttf` masters in assets/fonts,
# cut down to what a French/English page can render: Basic Latin, Latin-1, the
# œ/Œ ligatures, typographic punctuation (’ « » – — … and the narrow no-break
# space French sets before ; : ! ?), € and ™ — Google Fonts' "latin" range —
# plus the arrows, ★, ✓, ☎ and ☰ the copy draws. tests/fonts.test.ts holds the
# copy to this list.
# Layout features are all kept, so `tnum` and the kerning survive.
#
# Full Inter carries Cyrillic, Greek and Vietnamese: ~115 KB per weight, the
# heaviest thing on the page after the hero photo. This cut is ~25 KB.
# Needs fonttools with brotli (`pip install fonttools brotli`).
set -euo pipefail
cd "$(dirname "$0")/../assets/fonts"

LATIN="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2190-2193,U+2212,U+2215,U+2605,U+260E,U+2630,U+2713,U+FEFF,U+FFFD"

for ttf in *.ttf; do
  pyftsubset "$ttf" \
    --unicodes="$LATIN" \
    --layout-features='*' \
    --flavor=woff2 \
    --output-file="${ttf%.ttf}.woff2"
done

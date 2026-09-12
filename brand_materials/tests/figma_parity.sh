#!/usr/bin/env bash
# Checks each rendered page against the Figma export in __screenshots__/.
#
# Typst and Figma rasterise glyphs differently, so a raw pixel count is ~4% even
# when the layouts agree. Both images are blurred first: that erases antialiasing
# fringes and sub-pixel advance drift, while a misplaced element still registers
# as a solid blob (a 2px shift of the largest headline already trips the tolerance).
#
# Advance drift accumulates along a run and scales with the type, so the blur that
# forgives it does too: each material's sigma is the card's, times the factor its
# lock-up is drawn at (`k` in lib.typ). At the sheet's 6.75 a 9px shift of the whole
# design still scores 15x the tolerance.
set -euo pipefail

cd "$(dirname "$0")/.."
out=tests/tmp
tolerance=0.001

rm -rf "$out"
mkdir -p "$out"
# `--root ..`: lib.typ reads the shared brand.toml and mark.svg from ../assets/.
compile() { # <lang> <material> <polarity> <destination pattern>
	typst compile --root .. --ignore-system-fonts --font-path ../assets/fonts \
		--input "lang=$1" --input "material=$2" --input "polarity=$3" \
		--input "trim-guide=$([ "$2" = card ] && echo true || echo false)" \
		--ppi 300 --format png __main__.typ "$4"
}

# Every cut the design has: the card is one polarity per face, the sheet is cut both ways.
cuts=("card light" "sheet light" "sheet dark")
for cut in "${cuts[@]}"; do
	# shellcheck disable=SC2086  # the cut is two words, and they are two arguments
	compile en $cut "$out/${cut// /-}-{p}.png"
done

status=0
for spec in card-light-1:front:1.5 card-light-2:back:1.5 sheet-light-1:sheet-light:6.75 sheet-dark-1:sheet-dark:6.75; do
	IFS=: read -r src name blur <<<"$spec"
	expected=$out/$name-expected.png
	actual=$out/$name-actual.png
	magick "tests/__screenshots__/figma-$name.png" -blur "0x$blur" "$expected"
	magick "$out/$src.png" -blur "0x$blur" "$actual"

	ratio=$(compare -metric AE -fuzz 20% "$expected" "$actual" "$out/$name-diff.png" 2>&1 |
		sed -E 's/.*\(([0-9.eE+-]+)\).*/\1/' || true)
	if awk -v r="$ratio" -v t="$tolerance" 'BEGIN { exit !(r <= t) }'; then
		printf '  ✓ %s (%s)\n' "$name" "$ratio"
	else
		status=1
		printf '  ✗ %s diverges from the Figma design (%s > %s)\n' "$name" "$ratio" "$tolerance"
		printf '      expected  %s\n      actual    %s\n      diff      %s\n' \
			"$PWD/$expected" "$PWD/$actual" "$PWD/$out/$name-diff.png"
	fi
done

# Only en has Figma frames. The rest are checked for fitting the fixed boxes, which
# is where a translation breaks — lib.typ asserts on every box it cannot grow.
for lang in fr; do
	for cut in "${cuts[@]}"; do
		# shellcheck disable=SC2086  # the cut is two words, and they are two arguments
		if compile "$lang" $cut "$out/$lang-${cut// /-}-{p}.png"; then
			printf '  ✓ %s %s fits the layout\n' "$lang" "$cut"
		else
			status=1
			printf '  ✗ %s %s does not fit the layout\n' "$lang" "$cut"
		fi
	done
done

if typst compile --root .. --ignore-system-fonts --font-path ../assets/fonts --format png \
	tests/rejects_invalid_card.typ /dev/null 2>/dev/null; then
	status=1
	printf '  ✗ card() accepted a blank name\n'
else
	printf '  ✓ card() rejects invalid data\n'
fi

exit $status

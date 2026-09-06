#!/usr/bin/env bash
# Checks each rendered page against the Figma export in __screenshots__/.
#
# Typst and Figma rasterise glyphs differently, so a raw pixel count is ~4% even
# when the layouts agree. Both images are blurred first: that erases antialiasing
# fringes and sub-pixel advance drift, while a misplaced element still registers
# as a solid blob (a 2px shift of the largest headline already trips the tolerance).
set -euo pipefail

cd "$(dirname "$0")/.."
out=tests/tmp
tolerance=0.001

rm -rf "$out"
mkdir -p "$out"
compile() { # <lang> <destination pattern>
	typst compile --ignore-system-fonts --font-path fonts --input "lang=$1" --input trim-guide=true \
		--ppi 300 --format png __main__.typ "$2"
}
compile en "$out/page-{p}.png"

status=0
for pair in 1:front 2:back; do
	name=${pair#*:}
	expected=$out/$name-expected.png
	actual=$out/$name-actual.png
	magick "tests/__screenshots__/figma-$name.png" -blur 0x1.5 "$expected"
	magick "$out/page-${pair%%:*}.png" -blur 0x1.5 "$actual"

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
	if compile "$lang" "$out/$lang-{p}.png"; then
		printf '  ✓ %s fits the layout\n' "$lang"
	else
		status=1
		printf '  ✗ %s does not fit the layout\n' "$lang"
	fi
done

if typst compile --ignore-system-fonts --font-path fonts --format png \
	tests/rejects_invalid_card.typ /dev/null 2>/dev/null; then
	status=1
	printf '  ✗ card() accepted a blank name\n'
else
	printf '  ✓ card() rejects invalid data\n'
fi

exit $status

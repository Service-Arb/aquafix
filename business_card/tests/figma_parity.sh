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
typst compile --ignore-system-fonts --font-path fonts --input trim-guide=true \
	--ppi 300 --format png __main__.typ "$out/page-{p}.png"

status=0
for page in 1:front 2:back; do
	name=${page#*:}
	expected=$out/$name-expected.png
	actual=$out/$name-actual.png
	magick "tests/__screenshots__/figma-$name.png" -blur 0x1.5 "$expected"
	magick "$out/page-${page%%:*}.png" -blur 0x1.5 "$actual"

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

if typst compile --ignore-system-fonts --font-path fonts --format png \
	tests/rejects_invalid_card.typ /dev/null 2>/dev/null; then
	status=1
	printf '  ✗ card() accepted a blank name\n'
else
	printf '  ✓ card() rejects invalid data\n'
fi

exit $status

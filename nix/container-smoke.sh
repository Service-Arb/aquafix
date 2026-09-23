#!/usr/bin/env bash
# Boots the OCI image the release ships and holds it to its contract: it
# listens on 59081 on every interface, answers /health, renders a point and the
# OG card from the files it carries, writes a posted lead into the /data mount,
# and refuses to serve at all when the prod env is missing. Linux + docker.
#
#   bash nix/container-smoke.sh
set -euo pipefail

port=59081
data="$(mktemp -d)"
chmod 777 "$data"
image="$(nix build .#container --no-link --print-out-paths)"
docker load <"$image" >/dev/null

cleanup() {
  docker logs smoke 2>&1 | tail -20 || true
  docker rm -f smoke smoke-bare >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker run -d --name smoke -p "$port:$port" -v "$data:/data" aquafix:latest >/dev/null
for _ in $(seq 60); do curl -fsS "localhost:$port/health" >/dev/null 2>&1 && break; sleep 1; done

status() { curl -s -o /dev/null -w '%{http_code}' "$@"; }
expect() {
  local want="$1"
  shift
  local got
  got="$(status "$@")"
  [ "$got" = "$want" ] || { echo "✘ $* → $got, expected $want" >&2; exit 1; }
  echo "✓ $want  $*"
}

expect 200 "localhost:$port/health"
expect 302 "localhost:$port/"
expect 200 -H "Host: royat.aquafix.top" "localhost:$port/fr"
expect 200 "localhost:$port/og?l=royat"

# A person's submission: rendered five seconds ago, honeypot empty.
rendered=$(($(date +%s) * 1000 - 5000))
expect 303 -H "Host: royat.aquafix.top" \
  --data-urlencode "location=royat" --data-urlencode "locale=fr" --data-urlencode "form_id=quote" \
  --data-urlencode "t=$rendered" --data-urlencode "website=" --data-urlencode "job=blocked_drain" \
  --data-urlencode "zip=63130" --data-urlencode "mobile=0612345678" \
  "localhost:$port/quote"
[ -s "$data/leads.db" ] || { echo "✘ no leads.db in the /data mount" >&2; exit 1; }
echo "✓ the lead is in the mount"

# Without the prod env the server must not come up on dev defaults.
docker run -d --name smoke-bare -p "$((port + 1)):$port" -e LEADS_DB_PATH= aquafix:latest >/dev/null
for _ in $(seq 30); do [ "$(status "localhost:$((port + 1))/health")" != 000 ] && break; sleep 1; done
expect 500 "localhost:$((port + 1))/health"

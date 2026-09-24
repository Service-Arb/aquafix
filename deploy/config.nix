# The prod environment of the server, baked into the image as plain env
# (`flake.nix: prodEnv`). Secret-free — SMTP_URL, SMS_TOKEN and POSTHOG_KEY
# (and LEAD_NOTIFY_TO/FROM, LOCATIONS_API_URL when used) arrive from the
# container environment the k8s Secret injects via `envFrom`.
#
# Explicit because the defaults are dev's: without HOSTNAME the standalone
# server binds one interface the readiness probe may not reach, and without
# LEADS_DB_PATH leads would be written outside the mounted volume — which the
# server refuses in production (instrumentation.ts), as it refuses a missing
# TRUSTED_PROXY: every request, /health included, answers 500, so the pod never
# turns ready rather than losing a lead.
{ port }:
{
  # The mount, not $HOME. Leads are the only durable state this service has.
  LEADS_DB_PATH = "/data/leads.db";
  # Whose address the rate limit counts; production refuses to start without
  # it. The origin is reached only through the cloudflared tunnel (Cloudflare
  # → cloudflared → Traefik `web` → here; devops flake.nix), so
  # CF-Connecting-IP is the visitor. Anything reaching the pod around the
  # tunnel could write that header itself: then "xff:<n>" for n proxies.
  TRUSTED_PROXY = "cloudflare";
  HOSTNAME = "0.0.0.0";
  PORT = toString port;
  NODE_ENV = "production";
  NEXT_TELEMETRY_DISABLED = "1";
}

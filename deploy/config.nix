# The prod environment of the server, baked into the image as plain env
# (`flake.nix: prodEnv`). Secret-free — SMTP_URL and SMS_TOKEN (and
# LEAD_NOTIFY_TO/FROM, LOCATIONS_API_URL when used) arrive from the container
# environment the k8s Secret injects via `envFrom`, which can still override
# anything set here. So do LEAD_WEBHOOK_URL, LEAD_WEBHOOK_KEY_ID and
# LEAD_WEBHOOK_SECRET, together: the URL alone fails boot, and it is not set
# here because without it the lead webhook is simply off.
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
  # PostHog's project token is a write-only ingest key every visitor's browser
  # already receives in the page, so it is not a secret. The EV Invest
  # project on US Cloud (614067), shared with the EV fronts; events carry
  # `brand_id` = aquafix. Without it every capture is a silent no-op — the
  # funnel and the A/B tests (docs/EXPERIMENTS.md) record nothing.
  POSTHOG_KEY = "phc_sBwWEgdgockVmfyucBRkTTo6iZ4Y2eApSGorD22WLzj3";
  POSTHOG_HOST = "https://us.i.posthog.com";
}

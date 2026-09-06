# Prod `AppConfig`, evaluated to JSON at build time and baked into the image
# (`flake.nix: prodConfig`). Secret-free — SMTP_URL, SMS_TOKEN and POSTHOG_KEY
# arrive from the container environment the k8s Secret injects via `envFrom`.
#
# Passed to the binary as `--config` explicitly. Without it the binary searches
# only XDG dirs and the `AQUAFIX_*` env namespace, and would silently boot on
# dev defaults: a 127.0.0.1 bind that fails the readiness probe, and leads
# written outside the mounted volume.
{ port }:
{
  # The mount, not $HOME. Leads are the only durable state this service has.
  db_path = "/data/leads.db";
  socket_addr = "0.0.0.0:${toString port}";
}

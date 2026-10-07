import { createServer } from "node:http";

/**
 * The places API (`LOCATIONS_API_URL`) for the messenger spec's own server:
 * Royat with its own WhatsApp number and the brand's Telegram bot, as the
 * panel will serve them once the owner sets them (MESSENGER-CHANNELS-SPEC §4,
 * the local stack's seed), every other point as baked (an empty answer), and
 * the code's experiments untouched (no overrides). Run by Playwright as a
 * `webServer` with Node's type stripping — so no imports of our own, and only
 * syntax Node can strip. The other specs' server has no `LOCATIONS_API_URL`
 * and never reaches it: a point with no WhatsApp of its own draws the control
 * in every `lead_channel` arm, which they rely on.
 */

const port = Number(process.argv[2] ?? "");
if (!Number.isInteger(port) || port <= 0) throw new Error("places-api: pass the port as the first argument");

/** What the panel answers for Royat — `ROYAT_WHATSAPP` / `ROYAT_TELEGRAM_BOT` in env.ts, which the spec checks the links against. */
const ROYAT_LIVE = { whatsapp: "+33612345678", telegram: "aquafix_devis_bot" };

createServer((request, response) => {
  const path = new URL(request.url ?? "/", "http://places.invalid").pathname;
  const json = (status: number, body: unknown) => {
    response.writeHead(status, { "content-type": "application/json" });
    response.end(JSON.stringify(body));
  };
  if (path === "/health") return json(200, { ok: true });
  if (path === "/experiments") return json(200, { experiments: {} });
  const slug = /^\/locations\/([a-z0-9-]+)$/.exec(path)?.[1];
  if (slug === "royat") return json(200, ROYAT_LIVE);
  if (slug !== undefined) return json(200, {});
  return json(404, { error: "not_found" });
}).listen(port, "127.0.0.1");

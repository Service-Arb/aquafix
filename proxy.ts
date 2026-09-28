import { experimentProxy } from "@/features/experiments/proxy";

/**
 * kitstart's `createProxy(site)` — which point and which language a request
 * gets — with the A/B assignment composed on top (`features/experiments`).
 */
export const proxy = experimentProxy;

export const config = {
  // A literal: Next reads it statically. Everything but the build output —
  // files too: `decide` passes the routes outside `[locale]` and 404s every
  // other path, `/wp-login.php` included; the app-root icons pass as the
  // site's `publicFiles` (shared/config/site.ts).
  matcher: ["/((?!_next/).*)"],
};

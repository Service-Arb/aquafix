import { createProxy } from "@evinvest/kitstart/proxy";
import { site } from "@/shared/config/site";

export const proxy = createProxy(site);

export const config = {
  // A literal: Next reads it statically. Everything but the build output —
  // files too: `decide` passes the routes outside `[locale]` and 404s every
  // other path, `/wp-login.php` included (this site serves no public files).
  matcher: ["/((?!_next/).*)"],
};

import type { NextRequest } from "next/server";
import { routeRequest } from "@/features/request-routing";

export function proxy(request: NextRequest) {
  return routeRequest(request);
}

export const config = {
  // Everything but the build output. Files with an extension enter too: the
  // app serves none from `public/`, and a scanner's `/wp-login.php` let past
  // here would reach `[locale]` and be cached as a 404 page. `decide` owns the
  // list of what passes (`NON_PAGE_ROUTES`) — a second list here would drift.
  matcher: ["/((?!_next/).*)"],
};

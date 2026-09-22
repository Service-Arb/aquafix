import type { NextRequest } from "next/server";
import { routeRequest } from "@/features/request-routing";

export function proxy(request: NextRequest) {
  return routeRequest(request);
}

export const config = {
  // Everything but the build output and files with an extension. `/quote`,
  // `/og` and `/health` enter and are passed through by `decide`, which owns
  // the list of what is a page — a second list here would drift from it.
  matcher: ["/((?!_next/|.*\\.[a-z0-9]+$).*)"],
};

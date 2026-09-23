import { site } from "@/shared/config/site";
import { createRouting } from "./decide";
import { createProxy } from "./proxy";

/** The routing machinery, bound to this site once. */
export const routing = createRouting(site);
export const routeRequest = createProxy(routing);

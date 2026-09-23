import { routing } from "./model/routing";

export const { decide, hostSlug } = routing;
export { LANG_COOKIE, LANG_COOKIE_MAX_AGE, type Decision, type RequestFacts } from "./model/decide";
export { routeRequest } from "./model/routing";

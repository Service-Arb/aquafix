import { routing } from "./model/routing";

export const { decide, hostSlug } = routing;
export { LANG_COOKIE, LANG_COOKIE_MAX_AGE, NON_PAGE_ROUTES, type Decision, type RequestFacts } from "./model/decide";
export { routeRequest } from "./model/routing";

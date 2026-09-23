// The React-free half of the public API: a route handler or a server module
// imports this and never pulls the client island in.
export { analyticsSink, ALLOWED_PROPS, countsAsPageView, EVENTS, type AnalyticsTarget, type IntentChannel } from "./model/events";

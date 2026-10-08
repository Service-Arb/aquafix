// One public entry per page, no barrel: the client islands a server module
// reaches are not tree-shaken, so a route importing a barrel shipped those of
// every view in it — the home's form and A/B switcher on every sub-page.
export { LocationHome } from "./ui/LocationHome";

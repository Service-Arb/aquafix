/** Past this, the photograph is leaving and the bar needs a surface of its own. */
export const SCROLLED_PX = 8;

/** Set by `HeaderSurface` once hydrated: the inline script hands over to it. */
export const SURFACE_LIVE = "data-surface-live";

/**
 * The home header's surface before hydration, inlined right in the header so
 * it runs as the header is parsed. A page loaded mid-scroll — a reload, a
 * link to `#reviews` — would otherwise paint the dark overlay over a light
 * band until the islands hydrate. `#quote` is the quote card in the hero, at
 * the top. It follows the scroll until `HeaderSurface` takes over.
 */
export const SURFACE_SCRIPT = `(function(){var h=document.currentScript.parentElement;function f(){if(h.hasAttribute("${SURFACE_LIVE}"))return removeEventListener("scroll",f);var y=scrollY>${SCROLLED_PX},s=y||(location.hash!==""&&location.hash!=="#quote");h.toggleAttribute("data-scrolled",y);h.classList.toggle("dark",!s);h.classList.toggle("light",s)}f();addEventListener("scroll",f,{passive:true})})()`;

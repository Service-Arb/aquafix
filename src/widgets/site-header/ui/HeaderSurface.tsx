"use client";

import { useEffect, useRef } from "react";
import { SCROLLED_PX, SURFACE_LIVE } from "../lib/surface";

/**
 * The home header's surface: the dark overlay on the photograph while the
 * page is at the top, the sub-pages' light bar once scrolled or while the
 * menu is open. The polarity is a class the palette keys its tokens on
 * (`.dark` / `.light`), so it flips here rather than in CSS. `data-scrolled`
 * says why. Before hydration `SURFACE_SCRIPT` does this; without script the
 * header stays as at the top. A leaf of its own so the header around it stays
 * server-rendered.
 */
export function HeaderSurface() {
  const anchor = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const header = anchor.current?.closest("header");
    if (!header) return;
    const menu = header.querySelector("details");
    const summary = menu?.querySelector("summary");
    const apply = (scrolled: boolean, open: boolean) => {
      const solid = scrolled || open;
      header.toggleAttribute("data-scrolled", scrolled);
      header.classList.toggle("dark", !solid);
      header.classList.toggle("light", solid);
    };
    const sync = () => apply(window.scrollY > SCROLLED_PX, menu?.open === true);
    // `toggle` fires a task after the click: flipping on it painted one frame
    // of a dark panel. The click lands before the disclosure toggles.
    const onSummary = () => apply(window.scrollY > SCROLLED_PX, menu?.open !== true);
    header.setAttribute(SURFACE_LIVE, "");
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    menu?.addEventListener("toggle", sync);
    summary?.addEventListener("click", onSummary);
    return () => {
      window.removeEventListener("scroll", sync);
      menu?.removeEventListener("toggle", sync);
      summary?.removeEventListener("click", onSummary);
    };
  }, []);
  return <span ref={anchor} hidden />;
}

"use client";

import { useEffect, useRef } from "react";

/** Past this, the photograph is leaving and the bar needs a surface of its own. */
const SCROLLED_PX = 8;

/**
 * The home header's surface: the dark overlay on the photograph while the
 * page is at the top, the sub-pages' light bar once scrolled or while the
 * menu is open. The polarity is a class the palette keys its tokens on
 * (`.dark` / `.light`), so it flips here rather than in CSS. `data-scrolled`
 * says why. Without script the header stays as at the top. A leaf of its own
 * so the header around it stays server-rendered.
 */
export function HeaderSurface() {
  const anchor = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const header = anchor.current?.closest("header");
    if (!header) return;
    const menu = header.querySelector("details");
    const sync = () => {
      const scrolled = window.scrollY > SCROLLED_PX;
      const solid = scrolled || menu?.open === true;
      header.toggleAttribute("data-scrolled", scrolled);
      header.classList.toggle("dark", !solid);
      header.classList.toggle("light", solid);
    };
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    menu?.addEventListener("toggle", sync);
    return () => {
      window.removeEventListener("scroll", sync);
      menu?.removeEventListener("toggle", sync);
    };
  }, []);
  return <span ref={anchor} hidden />;
}

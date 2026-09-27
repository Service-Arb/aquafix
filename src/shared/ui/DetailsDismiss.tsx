"use client";

import { useEffect, useRef } from "react";

/** A popover (the work band's detail) takes Escape first: it is the top layer. */
function popoverOpen(): boolean {
  try {
    return document.querySelector(":popover-open") !== null;
  } catch {
    // A browser without the Popover API has none open.
    return false;
  }
}

/**
 * Closes the `<details>` it is rendered in on Escape, on a press or a focus
 * outside it — Tab past the last link would otherwise leave focus in the page
 * under the scrim — on a click on an element of it marked `data-dismiss` (a
 * scrim), and on following one of its own links — what a visitor expects of a menu,
 * and what the platform's disclosure does not do. A link to a `#` on the same
 * page leaves the page where it is, so the menu would stay open over the
 * section it just scrolled to. Before hydration, or without script, the
 * `<details>` is the platform's own and still opens and closes on its
 * summary. A leaf of its own so the menu around it stays server-rendered.
 *
 * `closeFrom`, a media query: once it matches — a phone turned on its side, a
 * window widened — the menu closes, since from there the row carries what it
 * held and an open `<details>` would keep the page locked behind nothing.
 */
export function DetailsDismiss({ closeFrom }: { closeFrom?: string }) {
  const anchor = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const details = anchor.current?.closest("details");
    if (!details) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !details.open || e.defaultPrevented || popoverOpen()) return;
      const hadFocus = details.contains(document.activeElement);
      details.open = false;
      // Focus inside a closed disclosure would be on nothing visible.
      if (hadFocus) details.querySelector("summary")?.focus();
    };
    const outside = (e: Event) => {
      if (details.open && e.target instanceof Node && !details.contains(e.target)) details.open = false;
    };
    // The scrim closes on a click, not a press: closed on pointerdown it would
    // vanish under the finger and the tap's click would land on the page below.
    const onClick = (e: MouseEvent) => {
      if (e.target instanceof Element && e.target.closest("a[href], [data-dismiss]")) details.open = false;
    };
    const wide = closeFrom ? window.matchMedia(closeFrom) : null;
    const onWide = () => {
      if (wide?.matches) details.open = false;
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", outside);
    details.addEventListener("click", onClick);
    wide?.addEventListener("change", onWide);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", outside);
      details.removeEventListener("click", onClick);
      wide?.removeEventListener("change", onWide);
    };
  }, [closeFrom]);
  return <span ref={anchor} hidden />;
}

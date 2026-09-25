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
 * Closes the `<details>` it is rendered in on Escape, on a press outside it,
 * and on following one of its own links — what a visitor expects of a menu,
 * and what the platform's disclosure does not do. A link to a `#` on the same
 * page leaves the page where it is, so the menu would stay open over the
 * section it just scrolled to. Before hydration, or without script, the
 * `<details>` is the platform's own and still opens and closes on its
 * summary. A leaf of its own so the menu around it stays server-rendered.
 */
export function DetailsDismiss() {
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
    const onPress = (e: PointerEvent) => {
      if (details.open && e.target instanceof Node && !details.contains(e.target)) details.open = false;
    };
    const onFollow = (e: MouseEvent) => {
      if (e.target instanceof Element && e.target.closest("a[href]")) details.open = false;
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPress);
    details.addEventListener("click", onFollow);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPress);
      details.removeEventListener("click", onFollow);
    };
  }, []);
  return <span ref={anchor} hidden />;
}

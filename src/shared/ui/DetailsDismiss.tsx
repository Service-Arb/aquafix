"use client";

import { useEffect, useRef } from "react";

/**
 * Closes the `<details>` it is rendered in on Escape or a press outside it —
 * what a visitor expects of a menu, and what the platform's disclosure does
 * not do. Before hydration, or without script, the `<details>` is the
 * platform's own and still opens and closes on its summary. A leaf of its own
 * so the menu around it stays server-rendered.
 */
export function DetailsDismiss() {
  const anchor = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const details = anchor.current?.closest("details");
    if (!details) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !details.open) return;
      const hadFocus = details.contains(document.activeElement);
      details.open = false;
      // Focus inside a closed disclosure would be on nothing visible.
      if (hadFocus) details.querySelector("summary")?.focus();
    };
    const onPress = (e: PointerEvent) => {
      if (details.open && e.target instanceof Node && !details.contains(e.target)) details.open = false;
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPress);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPress);
    };
  }, []);
  return <span ref={anchor} hidden />;
}

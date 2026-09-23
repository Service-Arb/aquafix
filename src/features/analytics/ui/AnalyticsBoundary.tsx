"use client";

import { ContactLinkTracker } from "@evinvest/marketing/react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, type ReactNode } from "react";
import { analyticsSink, countsAsPageView, EVENTS, type AnalyticsTarget, type IntentChannel } from "../model/events";

/** `data-intent` on a link or button marks a conversion intent that is not a contact link. */
const INTENT_ATTR = "data-intent";
const INTENTS: readonly IntentChannel[] = ["form_open", "booking"];

function source(): string {
  const utm = new URLSearchParams(window.location.search).get("utm_source");
  if (utm) return utm.slice(0, 64);
  if (!document.referrer) return "direct";
  try {
    const host = new URL(document.referrer).hostname;
    return host === window.location.hostname ? "internal" : host;
  } catch {
    return "unknown";
  }
}

/**
 * The only client island analytics needs. Everything it wraps stays server
 * rendered; this adds one delegated listener (via the marketing layer's
 * `ContactLinkTracker`, capture phase, never cancelling the navigation) and a
 * page-view beacon. With no key it sends nothing.
 */
export function AnalyticsBoundary({
  target,
  locationId,
  children,
}: {
  target: AnalyticsTarget;
  locationId: string;
  children: ReactNode;
}) {
  const sink = useMemo(() => analyticsSink(target, locationId), [target, locationId]);
  const pathname = usePathname();

  useEffect(() => {
    if (!countsAsPageView(pathname)) return;
    sink.capture(EVENTS.pageView, {
      source: source(),
      device: window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop",
    });
  }, [sink, pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const el = event.target instanceof Element ? event.target.closest(`[${INTENT_ATTR}]`) : null;
      const channel = el?.getAttribute(INTENT_ATTR);
      if (channel && INTENTS.some(i => i === channel)) {
        sink.capture(EVENTS.intent, { channel }, { transport: "beacon" });
      }
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [sink]);

  return (
    <ContactLinkTracker
      channels={["phone", "whatsapp"]}
      onContact={({ channel }) => sink.capture(EVENTS.intent, { channel }, { transport: "beacon" })}
    >
      {children}
    </ContactLinkTracker>
  );
}

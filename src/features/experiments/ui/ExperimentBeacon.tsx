"use client";

import { countsAsPageView, type AnalyticsTarget } from "@evinvest/kitstart";
import { contactChannel } from "@evinvest/marketing";
import { usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";
import { EXPERIMENT_IDS, EXPERIMENTS } from "@/shared/config/experiments";
import { assignedVariants, cookieReader, isForced, isSuperseded } from "@/shared/lib/experiments";
import { EXPERIMENT_EVENTS, experimentSink, supersededProp, type ExperimentChannel } from "../model/events";

function channelOf(target: EventTarget | null): ExperimentChannel | null {
  if (!(target instanceof Element)) return null;
  if (target.closest("[data-intent]")?.getAttribute("data-intent") === "form_open") return "form_open";
  const channel = contactChannel(target.closest("a[href]")?.getAttribute("href") ?? "");
  return channel === "phone" || channel === "whatsapp" ? channel : null;
}

/**
 * The A/B island beside kitstart's analytics one: an exposure per page view
 * and a contact per tap, each tagged with the variant this browser carries in
 * its `ab_*` cookie (the proxy's). No cookie — a crawler, a browser refusing
 * them — means no event: that visitor is in no arm. The browser knows only the
 * code's config; a test the panel switched off is filtered by the proxy, which
 * drops its cookie on the same response. Renders nothing; one
 * delegated listener, capture phase, never cancelling the navigation.
 */
export function ExperimentBeacon({ target, placeSlug }: { target: AnalyticsTarget; placeSlug: string }) {
  const { key, host, brandId } = target;
  const sink = useMemo(() => experimentSink({ key, host, brandId }, placeSlug), [key, host, brandId, placeSlug]);
  const pathname = usePathname();

  useEffect(() => {
    if (!countsAsPageView(pathname)) return;
    const read = cookieReader(document.cookie);
    const forced = isForced(read);
    const variants = assignedVariants(EXPERIMENTS, read);
    for (const id of EXPERIMENT_IDS) {
      const variant = variants[id];
      if (variant === undefined) continue;
      sink.capture(EXPERIMENT_EVENTS.exposed, { experiment: id, variant, forced, ...supersededProp(isSuperseded(id, variants)) });
    }
  }, [sink, pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const channel = channelOf(event.target);
      if (!channel) return;
      const read = cookieReader(document.cookie);
      const forced = isForced(read);
      const variants = assignedVariants(EXPERIMENTS, read);
      for (const id of EXPERIMENT_IDS) {
        const variant = variants[id];
        if (variant === undefined) continue;
        sink.capture(EXPERIMENT_EVENTS.contact, { experiment: id, variant, channel, forced, ...supersededProp(isSuperseded(id, variants)) }, { transport: "beacon" });
      }
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [sink]);

  return null;
}

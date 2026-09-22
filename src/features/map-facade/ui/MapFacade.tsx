"use client";

import { ClickToLoad } from "@evinvest/marketing/react";

/**
 * Google's map behind a click. Until the visitor asks, the page holds a button
 * and nothing else — no Google request, no cookie — so a cookieless page stays
 * cookieless and the emergency visitor's first load carries no map. The keyless
 * `output=embed` URL needs no API key in the build.
 */
export function MapFacade({ query, title, show, address }: { query: string; title: string; show: string; address: string }) {
  const src = `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
  return (
    <ClickToLoad
      className="relative aspect-[16/9] w-full overflow-hidden rounded-[var(--corner-card)] border border-border bg-muted md:aspect-[21/9]"
      placeholder={load => (
        <button
          type="button"
          onClick={load}
          className="flex size-full flex-col items-center justify-center gap-2 px-6 text-center hover:bg-hover"
        >
          <span className="font-display text-[17px] font-bold text-ink md:text-[19px]">{show}</span>
          <span className="text-[13.5px] text-ink-soft md:text-[14.5px]">{address}</span>
        </button>
      )}
    >
      <iframe
        title={title}
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="absolute inset-0 size-full border-0"
      />
    </ClickToLoad>
  );
}

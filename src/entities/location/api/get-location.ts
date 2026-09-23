import "server-only";
import { cache } from "react";
import { serverEnv } from "@/shared/config/env";
import type { Locale } from "@/shared/config/i18n";
import { bakedLocation, LOCATIONS } from "../config/locations";
import type { Location } from "../model/types";
import { mergeLive, parseLocationLive } from "./parse-live";

/**
 * TTL on the fetch itself, not on the page: a segment-level `revalidate` does
 * not reach an explicit `force-cache` fetch, which would then cache forever.
 * The source still sees one request per point per window, not one per visitor.
 */
export const LOCATION_REVALIDATE_SECONDS = 600;
const TIMEOUT_MS = 3_000;

export class LocationSourceError extends Error {}

type Outcome = { kind: "found"; location: Location } | { kind: "missing" };

async function fetchLive(base: string, baked: Location, locale: Locale): Promise<Outcome> {
  let response: Response;
  try {
    response = await fetch(`${base}/locations/${encodeURIComponent(baked.slug)}?locale=${locale}`, {
      cache: "force-cache",
      next: { revalidate: LOCATION_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (cause) {
    // Unreachable is not "gone": the baked config still knows the address and
    // the phone, and a plumber's page that answers from it is the point of
    // baking. The gate fields may be missing from it — then the page is
    // served `noindex` until the source is back, never a 404.
    console.error(`live location ${baked.slug}: source unreachable, serving baked`, cause);
    return { kind: "found", location: baked };
  }
  // A missing point is a real 404 (and `noindex`). A failing source is treated
  // like an unreachable one — the baked point, never a 404 that would teach a
  // crawler the page is gone. It used to throw for a 500, but the pages are
  // cached (ISR) now: a warm page keeps its last good render through an
  // outage anyway, and a cold one that throws gets Next's bare-text 500 with
  // no phone on it, not the error boundary.
  if (response.status === 404) return { kind: "missing" };
  if (!response.ok) {
    console.error(`live location ${baked.slug}: source answered ${response.status}, serving baked`);
    return { kind: "found", location: baked };
  }
  return { kind: "found", location: mergeLive(baked, parseLocationLive(await response.json())) };
}

/**
 * One point, baked config merged with the live source. `null` means the point
 * does not exist — the caller turns it into `notFound()`.
 *
 * Memoised per request on the pair (slug, locale): `cache` keys on its
 * arguments, and a slug-only key would let whichever locale rendered first
 * answer for both.
 */
export const getLocation = cache(async (slug: string, locale: Locale): Promise<Location | null> => {
  const baked = bakedLocation(slug);
  if (!baked) return null;
  const base = serverEnv().locationsApiUrl;
  if (!base) return baked;
  const outcome = await fetchLive(base, baked, locale);
  return outcome.kind === "found" ? outcome.location : null;
});

/**
 * Every point the source still has — a 404 is a point it retired, and is left
 * out. What happens on a failing source depends on who asks:
 *
 * - `"page"` (the brand page): lenient. A 5xx or an unreachable source serves
 *   the baked point; the list a visitor reads must not go down with the API.
 * - `"sitemap"`: strict. A 5xx or an unreachable source throws. A sitemap that
 *   silently drops points tells a crawler they are gone (site_conductor#184);
 *   a 5xx tells it to keep the last copy and come back.
 */
export async function listLocations(locale: Locale, mode: "page" | "sitemap"): Promise<Location[]> {
  const base = serverEnv().locationsApiUrl;
  if (!base) return [...LOCATIONS];
  const results = await Promise.all(
    LOCATIONS.map(async (baked): Promise<Location | null> => {
      let response: Response;
      try {
        response = await fetch(`${base}/locations/${encodeURIComponent(baked.slug)}?locale=${locale}`, {
          cache: "force-cache",
          next: { revalidate: LOCATION_REVALIDATE_SECONDS },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
      } catch (cause) {
        if (mode === "sitemap") throw new LocationSourceError(`location list: ${baked.slug} unreachable`, { cause });
        return baked;
      }
      if (response.status === 404) return null;
      if (!response.ok) {
        if (mode === "sitemap") {
          throw new LocationSourceError(`location list: ${baked.slug} answered ${response.status}`);
        }
        return baked;
      }
      return mergeLive(baked, parseLocationLive(await response.json()));
    }),
  );
  return results.filter((l): l is Location => l !== null);
}

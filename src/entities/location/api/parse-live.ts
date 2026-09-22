import type { DayOfWeek, Location, OpeningHours, PostalAddress, Rating } from "../model/types";

/**
 * The live half of a point, as `GET <LOCATIONS_API_URL>/locations/<slug>`
 * answers it. Every field is optional: whatever the source leaves out, the
 * baked config supplies. Validated here rather than cast — a response is a
 * promise from another service, not a type.
 */
export type LocationLive = Partial<
  Pick<
    Location,
    "phone" | "whatsapp" | "geo" | "hours" | "storefrontPhoto" | "landmark" | "serviceArea" | "rating"
  > & { address: Omit<PostalAddress, "region" | "country"> }
>;

const DAYS: readonly DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

type Json = Record<string, unknown>;

const isObject = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() !== "" ? v : undefined);
const num = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

function hours(v: unknown): OpeningHours[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out: OpeningHours[] = [];
  for (const row of v) {
    if (!isObject(row) || !Array.isArray(row.days)) return undefined;
    const days = row.days.filter((d): d is DayOfWeek => DAYS.includes(d as DayOfWeek));
    const opens = str(row.opens);
    const closes = str(row.closes);
    if (days.length !== row.days.length || !opens || !closes || !TIME.test(opens) || !TIME.test(closes)) {
      return undefined;
    }
    out.push({ days, opens, closes });
  }
  return out;
}

function rating(v: unknown): Rating | undefined {
  if (!isObject(v)) return undefined;
  const value = num(v.value);
  const count = num(v.count);
  const fetchedAt = str(v.fetchedAt);
  if (value === undefined || count === undefined || !fetchedAt || Number.isNaN(Date.parse(fetchedAt))) return undefined;
  if (value < 1 || value > 5 || count < 0) return undefined;
  return { value, count, fetchedAt };
}

function httpsUrl(v: unknown): string | undefined {
  const s = str(v);
  if (!s) return undefined;
  try {
    return new URL(s).protocol === "https:" ? s : undefined;
  } catch {
    return undefined;
  }
}

/** Drops what does not validate instead of failing the page on one bad field. */
export function parseLocationLive(body: unknown): LocationLive {
  if (!isObject(body)) throw new Error("live location: body is not an object");
  const live: LocationLive = {};
  const phone = str(body.phone);
  if (phone?.startsWith("+")) live.phone = phone;
  const whatsapp = str(body.whatsapp);
  if (whatsapp?.startsWith("+")) live.whatsapp = whatsapp;
  if (isObject(body.address)) {
    const street = str(body.address.street);
    const postalCode = str(body.address.postalCode);
    const locality = str(body.address.locality);
    if (street && postalCode && /^\d{5}$/.test(postalCode) && locality) live.address = { street, postalCode, locality };
  }
  if (isObject(body.geo)) {
    const lat = num(body.geo.lat);
    const lng = num(body.geo.lng);
    if (lat !== undefined && lng !== undefined) live.geo = { lat, lng };
  }
  const h = hours(body.hours);
  if (h && h.length > 0) live.hours = h;
  const photo = httpsUrl(body.storefrontPhoto);
  if (photo) live.storefrontPhoto = photo;
  if (isObject(body.landmark)) {
    const fr = str(body.landmark.fr);
    const en = str(body.landmark.en);
    if (fr && en) live.landmark = { fr, en };
  }
  if (Array.isArray(body.serviceArea)) {
    const area = body.serviceArea.map(str).filter((a): a is string => a !== undefined);
    if (area.length > 0) live.serviceArea = area;
  }
  const r = rating(body.rating);
  if (r) live.rating = r;
  return live;
}

export function mergeLive(baked: Location, live: LocationLive): Location {
  const { address, ...rest } = live;
  return {
    ...baked,
    ...rest,
    address: address ? { ...baked.address, ...address } : baked.address,
  };
}

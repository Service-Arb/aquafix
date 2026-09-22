import { copyFor, type Copy } from "@/entities/content";
import { bakedLocation, pointFor, type Location, type Point } from "@/entities/location";
import type { Locale } from "@/shared/config/i18n";

export function royat(overrides: Partial<Location> = {}): Location {
  const baked = bakedLocation("royat");
  if (!baked) throw new Error("fixture: royat is not configured");
  return { ...baked, ...overrides };
}

/** Every publication field filled — the shape an owner-completed point has. */
export function publishedRoyat(overrides: Partial<Location> = {}): Location {
  return royat({
    storefrontPhoto: "https://cdn.example/royat.jpg",
    landmark: { fr: "En face des thermes", en: "Opposite the spa" },
    serviceArea: ["Royat", "Chamalières", "Ceyrat"],
    hours: [{ days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "07:00", closes: "21:00" }],
    ...overrides,
  });
}

export function context(location: Location, locale: Locale = "fr"): { point: Point; copy: Copy } {
  return {
    point: pointFor(location, locale, "host"),
    copy: copyFor({ locale, place: location.place[locale], phone: location.phone }),
  };
}

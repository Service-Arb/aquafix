import { copyFor, type Copy } from "@/entities/content";
import { bakedPlace, contactOf, placeView, storefrontOf, type Place, type PlaceView } from "@/entities/place";
import type { Locale } from "@/shared/config/i18n";

type Storefront = NonNullable<ReturnType<typeof storefrontOf<Locale>>>;

export function royat(overrides: Partial<Place> = {}): Place {
  const baked = bakedPlace("royat");
  if (!baked) throw new Error("fixture: royat is not configured");
  return { ...baked, ...overrides };
}

/** Royat with some of its storefront fields replaced. */
export function withFront(place: Place, front: Partial<Omit<Storefront, "kind">>): Place {
  const current = storefrontOf(place);
  if (!current) throw new Error("fixture: not a storefront");
  return { ...place, presence: { ...current, ...front } };
}

/** Every publication field filled — the shape an owner-completed point has. */
export function publishedRoyat(overrides: Partial<Place> = {}, front: Partial<Omit<Storefront, "kind">> = {}): Place {
  const place = royat({
    serviceArea: [{ kind: "localities", names: ["Royat", "Chamalières", "Ceyrat"] }],
    hours: [{ days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"], opens: "07:00", closes: "21:00" }],
    ...overrides,
  });
  return withFront(place, {
    storefrontPhoto: "https://cdn.example/royat.jpg",
    landmark: { fr: "En face des thermes", en: "Opposite the spa" },
    ...front,
  });
}

export function context(place: Place, locale: Locale = "fr"): { point: PlaceView; copy: Copy } {
  return {
    point: placeView(place, locale, "host"),
    copy: copyFor({ locale, place: place.name[locale], phone: contactOf(place).phone }),
  };
}

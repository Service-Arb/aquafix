import type { Locale } from "@/shared/config/i18n";
import type { Place as CorePlace, PlaceLive as CorePlaceLive, PlaceView as CorePlaceView } from "@/shared/landing/core/place";

export type { DayOfWeek, Geo, OpeningHours, PostalAddress, Rating, ServiceArea } from "@/shared/landing/core/place";

/** One point of Aquafix, in its two languages. */
export type Place = CorePlace<Locale>;
export type PlaceView = CorePlaceView<Locale>;
export type PlaceLive = CorePlaceLive<Locale>;

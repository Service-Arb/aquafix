import type { Place as KitPlace, PlaceLive as KitPlaceLive, PlaceView as KitPlaceView } from "@evinvest/kitstart";
import type { Locale } from "@/shared/config/i18n";

export type { DayOfWeek, Geo, OpeningHours, PostalAddress, Rating, ServiceArea } from "@evinvest/kitstart";

/** One point of Aquafix, in its two languages. */
export type Place = KitPlace<Locale>;
export type PlaceView = KitPlaceView<Locale>;
export type PlaceLive = KitPlaceLive<Locale>;

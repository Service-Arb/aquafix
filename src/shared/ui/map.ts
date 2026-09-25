import type { MapFacadePart, PartClassNames } from "@evinvest/kitstart/react";

/**
 * The Figma frame's face over kitstart's `MapFacade`, for every band that
 * shows the map: the card corner on the box, and the call to action's two
 * lines at the frame's sizes through the facade's parts.
 */
export const MAP_FACE = "rounded-[var(--corner-card)]";

export const MAP_FACE_PARTS: PartClassNames<MapFacadePart> = {
  show: "text-[17px] leading-[inherit] md:text-[19px]",
  address: "text-[13.5px] leading-[inherit] md:text-[14.5px]",
};

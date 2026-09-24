/**
 * The Figma frame's face over kitstart's `MapFacade`, for every band that
 * shows the map: the card corner, and the call to action's two lines at the
 * frame's sizes. The facade takes one `className` and its button has no part
 * of its own, so the lines are reached by descendant selectors — no slot yet:
 * EV-invest/lib#156.
 */
export const MAP_FACE = [
  "rounded-[var(--corner-card)]",
  "[&_button>span:first-child]:text-[17px] [&_button>span:first-child]:leading-[inherit] md:[&_button>span:first-child]:text-[19px]",
  "[&_button>span:last-child]:text-[13.5px] [&_button>span:last-child]:leading-[inherit] md:[&_button>span:last-child]:text-[14.5px]",
].join(" ");

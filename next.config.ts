import { withLanding } from "@evinvest/kitstart/next/config";

/**
 * kitstart's landing config — standalone output, the card's facts, the mark
 * and the OG palette inlined from `assets/`, a day's `stale-while-revalidate`
 * tail, no image optimiser, the ISR cache in memory and the global 404 page.
 * The OG card sets type in the brand's display face; `ImageResponse` needs the
 * .ttf bytes at runtime, which file tracing cannot infer from a path.
 */
export default withLanding({}, { root: process.cwd(), ogFiles: ["./assets/fonts/*.ttf"] });

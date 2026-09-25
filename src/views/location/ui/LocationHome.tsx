import { JsonLd } from "@evinvest/marketing";
import { withLiveRating, type Copy } from "@/entities/content";
import { freshRating, type PlaceView } from "@/entities/place";
import { locationGraph } from "@/features/seo";
import { CallBar } from "@/widgets/call-bar";
import { Coverage } from "@/widgets/coverage";
import { Faq } from "@/widgets/faq";
import { GuaranteeBand } from "@/widgets/guarantee";
import { Hero } from "@/widgets/hero";
import { InlineCta } from "@/widgets/inline-cta";
import { Reviews } from "@/widgets/reviews";
import { OverlayHeader } from "@/widgets/site-header";
import { QuietFooter } from "@/widgets/site-footer";
import { StatsBand } from "@/widgets/stats-band";
import { Work } from "@/widgets/work";

/**
 * A point's home page. Its rule: text gets a measure and stops, only media may
 * fill the viewport; a band is one heading and one object. The form is in the
 * hero, so every band below argues for an action already on the first screen.
 */
export function LocationHome({ copy: base, point, now }: { copy: Copy; point: PlaceView; now: Date }) {
  const copy = withLiveRating(base, freshRating(point.place, now));
  return (
    <>
      <JsonLd data={locationGraph(point, copy, "home", now)} />
      <div className="relative">
        <OverlayHeader copy={copy} point={point} />
        <main>
          <Hero copy={copy} point={point} renderedAt={now.getTime()} />
          <StatsBand copy={copy} />
          <Work copy={copy} />
          <GuaranteeBand copy={copy} point={point} />
          <Reviews copy={copy} point={point} />
          <Coverage copy={copy} point={point} />
          <Faq copy={copy} />
          <InlineCta copy={copy} point={point} />
        </main>
        <QuietFooter copy={copy} point={point} />
      </div>
      <CallBar copy={copy} point={point} />
    </>
  );
}

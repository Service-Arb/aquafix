import { JsonLd } from "@evinvest/marketing";
import type { Copy } from "@/entities/content";
import type { PlaceView } from "@/entities/place";
import { locationGraph } from "@/features/seo";
import { CallBar } from "@/widgets/call-bar";
import { Closing } from "@/widgets/closing";
import { Coverage } from "@/widgets/coverage";
import { GuaranteeBand } from "@/widgets/guarantee";
import { Hero } from "@/widgets/hero";
import { PriceTable } from "@/widgets/price-table";
import { Reviews } from "@/widgets/reviews";
import { OverlayHeader } from "@/widgets/site-header";
import { QuietFooter } from "@/widgets/site-footer";
import { Work } from "@/widgets/work";

/**
 * A point's home page. Its rule: text gets a measure and stops, only media may
 * fill the viewport; a band is one heading and one object.
 */
export function LocationHome({ copy, point, now }: { copy: Copy; point: PlaceView; now: Date }) {
  return (
    <>
      <JsonLd data={locationGraph(point, copy, "home", now)} />
      <div className="relative">
        <OverlayHeader copy={copy} point={point} />
        <main>
          <Hero copy={copy} point={point} />
          <Work copy={copy} />
          <PriceTable copy={copy} />
          <GuaranteeBand copy={copy} />
          <Reviews copy={copy} />
          <Coverage copy={copy} point={point} />
          <Closing copy={copy} point={point} renderedAt={now.getTime()} />
        </main>
        <QuietFooter copy={copy} point={point} />
      </div>
      <CallBar copy={copy} point={point} />
    </>
  );
}

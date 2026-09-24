import { JsonLd } from "@evinvest/marketing";
import { withLiveRating, type Copy } from "@/entities/content";
import { freshRating, type PlaceView } from "@/entities/place";
import { locationGraph } from "@/features/seo";
import { PAGES, type PageKey } from "@/shared/config/site";
import { Crew } from "@/widgets/crew";
import { Faq } from "@/widgets/faq";
import { HowItWorks } from "@/widgets/how-it-works";
import { InlineCta } from "@/widgets/inline-cta";
import { Objections } from "@/widgets/objections";
import { PageHead } from "@/widgets/page-head";
import { ProofAside } from "@/widgets/proof-aside";
import { ServiceArea } from "@/widgets/service-area";
import { Services } from "@/widgets/services";
import { Footer } from "@/widgets/site-footer";
import { PageHeader } from "@/widgets/site-header";

type Subpage = Exclude<PageKey, "home">;

/** Header → head → the page's sections → one action → footer. */
export function LocationSubpage({ copy: base, point, page, now }: { copy: Copy; point: PlaceView; page: Subpage; now: Date }) {
  const copy = withLiveRating(base, freshRating(point.place, now));
  return (
    <>
      <JsonLd data={locationGraph(point, copy, page, now)} />
      <PageHeader copy={copy} point={point} suffix={PAGES[page]} />
      <main>
        <PageHead copy={copy} page={page} aside={<ProofAside copy={copy} href={point.href("#quote")} opensForm />} />
        {page === "prices" && (
          <>
            <Services copy={copy} />
            <Faq copy={copy} />
          </>
        )}
        {page === "guarantee" && (
          <>
            <Objections copy={copy} />
            <HowItWorks copy={copy} />
          </>
        )}
        {page === "about" && (
          <>
            <Crew copy={copy} />
            <ServiceArea copy={copy} point={point} />
          </>
        )}
        <InlineCta copy={copy} point={point} />
      </main>
      <Footer copy={copy} point={point} />
    </>
  );
}

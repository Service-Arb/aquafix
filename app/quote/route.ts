import { quoteRoute } from "@evinvest/kitstart/next";
import { copyFor } from "@/entities/content";
import { notifier } from "@/entities/lead/server";
import { contactOf } from "@/entities/place";
import { serverEnv } from "@/shared/config/env";
import { CARD, site } from "@/shared/config/site";

/**
 * The no-JS path, and the one that has to keep working: a plain form POST
 * answered with a 303, so a refresh does not resubmit.
 */
export const dynamic = "force-dynamic";

export const POST = quoteRoute(site, {
  env: serverEnv,
  notifier,
  // The self-contained 500 when the store refused the lead: the point's phone,
  // in the page's language.
  unavailable: (locale, place) => {
    const { t, f } = copyFor({
      locale,
      place: place?.name[locale] ?? site.brand.name,
      phone: place ? contactOf(place).phone : CARD.phone,
    });
    return {
      title: t.serverError.title,
      heading: t.serverError.headline.join(""),
      body: t.serverError.body(f),
      callLabel: t.callLabel(f),
    };
  },
});

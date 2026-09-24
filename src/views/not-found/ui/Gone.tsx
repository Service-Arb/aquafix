import "server-only";
import { site } from "@/shared/config/site";
import { StatusScreen } from "@/widgets/status-screen";
import { notFoundView } from "../model/view";

/**
 * The 404 for a dead path the proxy recognised (see `GONE`): the same screen
 * as the not-found boundary, rendered on the server into the response, so a
 * visitor without JavaScript and a crawler get the offer and the phone.
 */
export function Gone({ locale, location }: { locale: string; location?: string | undefined }) {
  const { copy, target } = notFoundView({ locale, location });
  return (
    <>
      <title>{`${copy.t.notFound.title} · ${site.brand.name}`}</title>
      <StatusScreen copy={copy} status={copy.t.notFound} target={target} />
    </>
  );
}

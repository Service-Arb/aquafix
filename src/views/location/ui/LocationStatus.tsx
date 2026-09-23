import type { Copy, StatusCopy } from "@/entities/content";
import { contactOf, type PlaceView } from "@/entities/place";
import { perLocale } from "@/shared/config/i18n";
import { StatusScreen } from "@/widgets/status-screen";

/** A status page inside a point: its phone, its home, its language switch. */
export function LocationStatus({
  copy,
  point,
  status,
  suffix,
}: {
  copy: Copy;
  point: PlaceView;
  status: StatusCopy;
  /** The page's own suffix, for the language switch; home for a dead URL. */
  suffix: string;
}) {
  return (
    <StatusScreen
      copy={copy}
      status={status}
      target={{
        phone: contactOf(point.place).phone,
        home: point.href(""),
        retry: point.href(suffix),
        langHrefs: perLocale(l => point.href(suffix, l)),
      }}
    />
  );
}

"use client";

import { useParams, usePathname } from "next/navigation";
import { copyFor } from "@/entities/content";
import { BRAND } from "@/shared/config/brand";
import { DEFAULT_LOCALE, isLocale, perLocale } from "@/shared/config/i18n";
import { StatusScreen } from "@/widgets/status-screen";

/**
 * The 500: a failing live source or a render error lands here. Client-only by
 * Next's contract, so it knows only the brand's phone, which is inlined at
 * build — enough, because the phone works whatever broke.
 */
export default function ServerError() {
  const params = useParams<{ locale?: string }>();
  const pathname = usePathname();
  const locale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const copy = copyFor({ locale, place: BRAND.name, phone: BRAND.phone });
  return (
    <StatusScreen
      copy={copy}
      status={copy.t.serverError}
      target={{ phone: BRAND.phone, home: `/${locale}`, retry: pathname, langHrefs: perLocale(l => `/${l}`) }}
    />
  );
}

import { LangSwitch } from "@evinvest/kitstart/react";
import { i18n, LOCALES, type Locale } from "@/shared/config/i18n";

/**
 * kitstart's `FR · EN` with this site's languages and their names filled in,
 * so a header or a footer passes only what differs: where each language's
 * link goes, the switch's accessible name in the page's language, the look.
 */
export function BrandLangSwitch({
  current,
  hrefs,
  label,
  className,
}: {
  current: Locale;
  /** The page's URL in each language, before `?lang=` is added. */
  hrefs: Readonly<Record<Locale, string>>;
  label: string;
  className: string;
}) {
  return (
    <LangSwitch
      current={current}
      locales={LOCALES}
      labels={i18n.labels}
      hrefs={hrefs}
      label={label}
      className={className}
    />
  );
}

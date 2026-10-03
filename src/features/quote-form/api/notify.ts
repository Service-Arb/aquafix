import "server-only";
import type { Lead } from "@evinvest/kitstart";
import { leadNotifier, type LeadMail, type LeadMailShown, type LeadNotifier } from "@evinvest/kitstart/server";
import { serverEnv } from "@/shared/config/env";
import { site } from "@/shared/config/site";
import { jobLabelFr } from "../lib/job-label";

/** The business reads its leads in French, whatever language the visitor wrote in. */
function frenchMail(lead: Lead, id: number, shown: LeadMailShown): LeadMail {
  return {
    subject: `${site.brand.name} — nouvelle demande (${lead.placeSlug ?? "point inconnu"})`,
    text: [
      `Demande #${id} — point ${lead.placeSlug ?? "inconnu"}${lead.spamVerdict ? ` — suspecte (${lead.spamVerdict})` : ""}`,
      "",
      `Intervention : ${shown.need}`,
      `Commune / CP : ${lead.locality}`,
      `Mobile       : ${lead.mobile}`,
      ...Object.entries(lead.extras).map(([name, value]) => `${name} : ${value}`),
    ].join("\n"),
  };
}

/** How the site writes its lead mail — apart from `notifier` so a test can build one against its own SMTP. */
export const NOTIFIER_OPTIONS = { format: frenchMail, needLabel: jobLabelFr } as const;

let built: LeadNotifier | undefined;

/**
 * Telling the business a lead arrived, once the lead is stored; allowed to
 * fail. Built at boot (`instrumentation.ts`), so an `SMTP_URL` that does not
 * parse fails startup rather than the first lead's mail. Here rather than in
 * the lead entity: the mail names the job in the copy's words.
 */
export function notifier(): LeadNotifier {
  built ??= leadNotifier(site, serverEnv(), NOTIFIER_OPTIONS);
  return built;
}

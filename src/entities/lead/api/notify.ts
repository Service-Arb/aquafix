import "server-only";
import type { Lead } from "@evinvest/kitstart";
import { leadNotifier, type LeadMail, type LeadNotifier } from "@evinvest/kitstart/server";
import { serverEnv } from "@/shared/config/env";
import { site } from "@/shared/config/site";

/** The business reads its leads in French, whatever language the visitor wrote in. */
function frenchMail(lead: Lead, id: number): LeadMail {
  return {
    subject: `${site.brand.name} — nouvelle demande (${lead.placeSlug ?? "point inconnu"})`,
    text: [
      `Demande #${id} — point ${lead.placeSlug ?? "inconnu"}${lead.spamVerdict ? ` — suspecte (${lead.spamVerdict})` : ""}`,
      "",
      `Intervention : ${lead.subject}`,
      `Commune / CP : ${lead.locality}`,
      `Mobile       : ${lead.mobile}`,
      ...Object.entries(lead.extras).map(([name, value]) => `${name} : ${value}`),
    ].join("\n"),
  };
}

let built: LeadNotifier | undefined;

/**
 * Telling the business a lead arrived, once the lead is stored; allowed to
 * fail. Built at boot (`instrumentation.ts`), so an `SMTP_URL` that does not
 * parse fails startup rather than the first lead's mail.
 */
export function notifier(): LeadNotifier {
  built ??= leadNotifier(site, serverEnv(), { format: frenchMail });
  return built;
}

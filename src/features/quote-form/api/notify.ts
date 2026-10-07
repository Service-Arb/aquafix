import "server-only";
import { channelOf, type Lead } from "@evinvest/kitstart";
import { leadNotifier, type LeadMail, type LeadMailShown, type LeadNotifier } from "@evinvest/kitstart/server";
import { text } from "@/entities/content";
import { serverEnv } from "@/shared/config/env";
import { URGENCIES, URGENCY_FIELD, URGENCY_LATER } from "@/shared/config/lead";
import { site } from "@/shared/config/site";
import { jobLabelFr } from "../lib/job-label";

const QUOTE_FORM = text("fr").quoteForm;
const URGENCY = QUOTE_FORM.urgency.options;

/** An extra as the mail prints it: the urgency in the form's words, any other as posted. */
function extraLine(name: string, value: string): string {
  if (name !== URGENCY_FIELD) return `${name} : ${value}`;
  const urgency = URGENCIES.find(u => u === value);
  const said = urgency !== undefined ? URGENCY[urgency].label : value === URGENCY_LATER ? QUOTE_FORM.messenger.notUrgent : value;
  return `Urgence      : ${said}`;
}

/** A WhatsApp or Telegram lead by the messenger's name: the customer writes there, not on the phone. */
function messengerOf(lead: Lead): string | null {
  const channel = channelOf(lead);
  return channel === "whatsapp" ? "WhatsApp" : channel === "telegram" ? "Telegram" : null;
}

/**
 * The business reads its leads in French, whatever language the visitor wrote
 * in. A messenger lead says so in the subject, and carries the reference its
 * chat starts with (`Réf.`), which the person answering matches it by.
 */
function frenchMail(lead: Lead, id: number, shown: LeadMailShown): LeadMail {
  const messenger = messengerOf(lead);
  return {
    subject: `${site.brand.name} — nouvelle demande${messenger ? ` ${messenger}` : ""} (${lead.placeSlug ?? "point inconnu"})`,
    text: [
      `Demande #${id} — point ${lead.placeSlug ?? "inconnu"}${lead.spamVerdict ? ` — suspecte (${lead.spamVerdict})` : ""}`,
      ...(messenger ? [`Canal        : ${messenger} — le client vous écrit`] : []),
      ...(lead.messageRef ? [`Réf.         : ${lead.messageRef}`] : []),
      "",
      `Intervention : ${shown.need}`,
      `Commune / CP : ${lead.locality}`,
      `Mobile       : ${lead.mobile}`,
      ...Object.entries(lead.extras).map(([name, value]) => extraLine(name, value)),
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

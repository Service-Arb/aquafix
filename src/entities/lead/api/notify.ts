import "server-only";
import { BRAND } from "@/shared/config/brand";
import type { ServerEnv } from "@/shared/config/env";
import { sendMail } from "@/shared/lib/smtp";
import type { Lead } from "../model/lead";

/**
 * Telling the business a lead arrived. Called only after the lead is stored,
 * and allowed to fail: a lead that is on disk but un-notified is a recoverable
 * problem; a 500 shown to a customer whose lead we already hold is not.
 */
export interface LeadNotifier {
  notify(lead: Lead, id: number): Promise<void>;
}

function body(lead: Lead, id: number): string {
  return [
    `Demande #${id} — point ${lead.locationId ?? "inconnu"}${lead.spamVerdict ? ` — suspecte (${lead.spamVerdict})` : ""}`,
    "",
    `Intervention : ${lead.job}`,
    `Commune / CP : ${lead.zip}`,
    `Mobile       : ${lead.mobile}`,
  ].join("\n");
}

export function leadNotifier(env: Pick<ServerEnv, "smtpUrl" | "notifyTo" | "notifyFrom" | "smsToken">): LeadNotifier {
  return {
    async notify(lead, id) {
      const channels: Promise<void>[] = [];
      if (env.smtpUrl) {
        channels.push(
          sendMail(env.smtpUrl, {
            from: env.notifyFrom ?? `leads@${BRAND.domain}`,
            to: env.notifyTo ?? BRAND.email,
            subject: `Aquafix — nouvelle demande (${lead.locationId ?? "point inconnu"})`,
            text: body(lead, id),
          }),
        );
      }
      if (env.smsToken) {
        // TODO(owner): no SMS provider is chosen; the token is read so the
        // deployment can already carry it, and the lead is still mailed.
        console.warn(`lead ${id}: SMS_TOKEN is set but no SMS provider is wired; not texted`);
      }
      if (channels.length === 0) {
        console.warn(`lead ${id}: no notification channel configured; the lead is stored and unsent`);
        return;
      }
      const results = await Promise.allSettled(channels);
      const failure = results.find(r => r.status === "rejected");
      if (failure) throw failure.reason;
    },
  };
}

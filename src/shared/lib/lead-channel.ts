import { channelsAvailable, messengerFacts } from "@evinvest/kitstart";
import { site } from "@/shared/config/site";
import { leadChannelRuns } from "./experiments";

/**
 * Whether `lead_channel` runs on this point's card ({@link leadChannelRuns}
 * over the point's own messenger facts). The one place both the card
 * (`QuoteForm`) and the QA menu's labels (`abSwitcherExperiments`) ask, so
 * the menu never calls a test inert that the card runs, or the reverse.
 *
 * Its own module, not `experiments.ts`: that one is imported by the client
 * beacon, and the site config would come along with it.
 */
export function leadChannelRunsAt(place: Parameters<typeof messengerFacts>[1]): boolean {
  return leadChannelRuns(channelsAvailable(messengerFacts(site, place)));
}

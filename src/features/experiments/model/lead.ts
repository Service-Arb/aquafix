import { AsyncLocalStorage } from "node:async_hooks";
import { after } from "next/server";
import { LOCATION_FIELD, type AnalyticsTarget } from "@evinvest/kitstart";
import { site } from "@/shared/config/site";
import { assignedVariants, cookieReader, isForced } from "@/shared/lib/experiments";
import { EXPERIMENT_EVENTS, experimentSink } from "./events";

type Deferred = () => Promise<void> | void;

export interface ExperimentLeadDeps {
  target: () => AnalyticsTarget;
  /** Work after the response; `after` from `next/server` by default. */
  later?: (task: Deferred) => void;
}

/**
 * `experiment_lead`, for exactly the leads kitstart counts as
 * `lead_form_submit`: stored and not held as spam. kitstart decides that
 * inside `quoteRoute` and says so only by deferring its notification, so the
 * route's `defer` is ours — it marks the request it runs in (async context,
 * not a shared variable: two posts can interleave) and passes the task on.
 * The variants come from the `ab_*` cookies the form's POST carries; the
 * point from the form, read from a copy of the body only once the lead was
 * accepted, when kitstart has already held it to its size limit.
 */
export function experimentLeads(deps: ExperimentLeadDeps) {
  const later = deps.later ?? after;
  const accepted = new AsyncLocalStorage<{ accepted: boolean }>();

  const defer = (task: Deferred): void => {
    const mark = accepted.getStore();
    if (mark) mark.accepted = true;
    later(task);
  };

  const wrap =
    (post: (request: Request) => Promise<Response>) =>
    async (request: Request): Promise<Response> => {
      const read = cookieReader(request.headers.get("cookie"));
      const variants = Object.entries(assignedVariants(read));
      const copy = variants.length > 0 ? request.clone() : null;
      const mark = { accepted: false };
      const response = await accepted.run(mark, () => post(request));
      if (mark.accepted && copy) {
        later(async () => {
          const slug = (await copy.formData()).get(LOCATION_FIELD);
          const place = typeof slug === "string" && site.placeSlugs.includes(slug) ? slug : null;
          const sink = experimentSink(deps.target(), place);
          const forced = isForced(read);
          for (const [experiment, variant] of variants) sink.capture(EXPERIMENT_EVENTS.lead, { experiment, variant, forced });
        });
      }
      return response;
    };

  return { defer, wrap };
}

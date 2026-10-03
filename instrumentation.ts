/**
 * Runs once when the server starts. Parsing the environment here turns a
 * missing prod setting into a server that answers 500 everywhere — its
 * readiness probe included, so the pod never turns ready — rather than one
 * that boots on dev defaults and writes leads outside the mounted volume.
 * Opening the lead store and building the notifier here do the same for a
 * volume or a `leads` table the store cannot use and an `SMTP_URL` that does
 * not parse: startup fails, not the first customer's submission. The lead
 * webhook is built here for the same reason, and started so that what a
 * previous process queued is delivered without waiting for the next lead.
 * Through that same outbox the panel is told which experiments this build
 * runs (`experiments.declared`), so its screen offers their weights and kill
 * switch; that never fails the start.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { serverEnv } = await import("@/shared/config/env");
  const { notifier, webhook } = await import("@/features/quote-form/server");
  const { checkLeadStore, declareExperiments } = await import("@evinvest/kitstart/server");
  const { EXPERIMENTS, EXPERIMENT_SUMMARIES } = await import("@/shared/config/experiments");
  notifier();
  await checkLeadStore(serverEnv());
  webhook()?.start();
  declareExperiments(webhook, EXPERIMENTS, { summaries: EXPERIMENT_SUMMARIES });
}

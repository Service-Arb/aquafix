/**
 * Runs once when the server starts. Parsing the environment here turns a
 * missing prod setting into a server that answers 500 everywhere — its
 * readiness probe included, so the pod never turns ready — rather than one
 * that boots on dev defaults and writes leads outside the mounted volume.
 * Opening the lead store here does the same for a volume or a `leads` table
 * the store cannot use: startup fails, not the first customer's submission.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { serverEnv } = await import("@/shared/config/env");
  const { checkLeadStore } = await import("@/entities/lead/server");
  await checkLeadStore(serverEnv());
}

import "server-only";
import type { ServerEnv } from "@/shared/config/env";
import { openLeadStore } from "@/shared/landing/server/lead-store";

/**
 * Opens the store once at boot and closes it again. A missing volume or a
 * `leads` table the migrations refuse then fails startup — the pod never turns
 * ready — instead of the first customer's submission. The route handler opens
 * its own handle on first use; SQLite migrations are idempotent under the lock.
 *
 * Says which adapter and where, because `LEADS_DB_URL` outranks the image's
 * `LEADS_DB_PATH`, and the log is the one place that shows which won.
 */
export async function checkLeadStore(env: Pick<ServerEnv, "leadsDb" | "leadsDbFrom">): Promise<void> {
  const store = openLeadStore(env.leadsDb);
  await store.close();
  console.info(`leads: ${env.leadsDb.kind} at ${env.leadsDb.path} (from ${env.leadsDbFrom})`);
}

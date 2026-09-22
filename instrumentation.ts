/**
 * Runs once when the server starts. Parsing the environment here turns a
 * missing prod setting into a failed start — a crash-looping pod someone looks
 * at — rather than a server that boots on dev defaults and writes leads
 * outside the mounted volume.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { serverEnv } = await import("@/shared/config/env");
  serverEnv();
}

import { tmpdir } from "node:os";
import { join } from "node:path";
import { CONTROL, EXPERIMENT_IDS } from "../../src/shared/config/experiments";

/**
 * What the server under test is started with, shared by the config (which
 * starts it) and the specs (which read what it wrote). A port of its own, so a
 * `nix run .#dev` on 59081 is never mistaken for the build under test.
 */
export const PORT = Number(process.env.E2E_PORT ?? 59089);

/** A point's own host. Chromium resolves every `*.localhost` to loopback. */
export const POINT_ORIGIN = `http://royat.localhost:${PORT}`;
export const APEX_ORIGIN = `http://localhost:${PORT}`;

/** Emptied when the server starts: an earlier run's rows must not satisfy this one. */
export const LEADS_DB = join(tmpdir(), `aquafix-e2e-${PORT}`, "leads.db");

/** Never resolves: every request to it is intercepted by the spec, or fails. */
export const POSTHOG_HOST = "https://posthog.e2e.invalid";
/** A syntactically plausible project key, so the beacon sink is live. */
export const POSTHOG_KEY = "phc_e2e_not_a_real_project";

/** The A/B control, for both hosts the specs visit (a cookie ignores the port). */
export const CONTROL_COOKIES = ["royat.localhost", "localhost"].flatMap(domain =>
  EXPERIMENT_IDS.map(id => ({
    name: `ab_${id}`,
    value: CONTROL[id],
    domain,
    path: "/",
    expires: -1,
    httpOnly: false,
    secure: false,
    sameSite: "Lax" as const,
  })),
);

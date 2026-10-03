import { createHmac } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  createAcceptLead,
  FORM_ID_FIELD,
  LOCALE_FIELD,
  LOCATION_FIELD,
  RateLimiter,
  RENDERED_AT_FIELD,
  SUBMISSION_FIELD,
  type Lead,
  type SpamVerdict,
} from "@evinvest/kitstart";
import { leadWebhook, parseServerEnv, type LeadWebhookContext, type ServerEnv } from "@evinvest/kitstart/server";
import { afterEach, describe, expect, it } from "vitest";
import { site } from "@/shared/config/site";
import { needLabel, PANEL_SUSPECT, webhookOptions } from "@/features/quote-form/server";
import { isOpaqueId, leadCreatedBody, panelLeadId, uuidV7, type BodyOptions } from "@/shared/lib/funnel-event";

const lead: Lead = {
  subject: "blocked_drain",
  locality: "63130",
  mobile: "06 12 34 56 78",
  extras: {},
  placeSlug: "royat",
  spamVerdict: null,
};

const ctx: LeadWebhookContext = {
  leadId: 42,
  brandId: "aquafix",
  locale: "fr",
  formId: "quote",
  at: new Date("2026-10-01T09:30:00.123Z"),
  idempotencyKey: "0b5c1f0e-7d1a-4e8b-9c2d-3f4a5b6c7d8e",
  leadRef: "lead-42-9f86d081",
};

const OPTS: BodyOptions = { sourceId: "aquafix-site", needLabel };

// kitstart's reference for the lead, the one the page and a booking name it by.
const LEAD_ID = "lead-42-9f86d081";

/** The proto3 JSON names of each message's fields, read from the panel's contract. */
function protoFields(): Map<string, Set<string>> {
  const proto = readFileSync(new URL("./support/sa-events.proto", import.meta.url), "utf8");
  const messages = new Map<string, Set<string>>();
  for (const [, name, body] of proto.matchAll(/^message (\w+) \{([^}]*)\}/gm)) {
    const fields = new Set<string>();
    for (const [, field] of (body ?? "").matchAll(/^\s*(?:optional |repeated )?[\w.]+ (\w+) = \d+;/gm)) {
      fields.add((field ?? "").replace(/_([a-z])/g, (_, c: string) => c.toUpperCase()));
    }
    messages.set(name ?? "", fields);
  }
  return messages;
}

const keysWithin = (value: object, message: string): void => {
  const allowed = protoFields().get(message);
  expect(allowed, message).toBeDefined();
  for (const key of Object.keys(value)) expect(allowed, `${message}.${key}`).toContain(key);
};

describe("lead.created for the panel", () => {
  it("builds one sa.funnel.v1 event from a lead", () => {
    const body = leadCreatedBody(lead, ctx, OPTS);
    expect(body).toEqual({
      events: [
        {
          id: uuidV7(ctx.at, ctx.idempotencyKey),
          schema: "sa.funnel.v1",
          type: "lead.created",
          typeVersion: 1,
          occurredAt: "2026-10-01T09:30:00.123Z",
          source: { kind: "site", id: "aquafix-site" },
          subject: { brandId: "aquafix", locationId: "royat", leadId: LEAD_ID },
          properties: { channel: "form" },
          pii: { phone: "06 12 34 56 78", need: "Canalisation bouchée", locality: "63130" },
        },
      ],
    });
  });

  it("names only fields the proto declares, in their protojson spelling", () => {
    const body = leadCreatedBody({ ...lead, extras: { note: "x" } }, ctx, OPTS);
    keysWithin(body, "IngestRequest");
    const [event] = body.events;
    keysWithin(event, "Event");
    keysWithin(event.source, "Source");
    keysWithin(event.subject, "Subject");
    // The panel checks registered properties strictly: an unknown field rejects the event.
    keysWithin(event.properties, "LeadCreatedV1");
  });

  it("meets the panel's checks on the envelope", () => {
    const [event] = leadCreatedBody(lead, ctx, OPTS).events;
    expect(event.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(event.occurredAt).toMatch(/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?Z$/);
    expect(event.subject.brandId).toMatch(/^[a-z0-9][a-z0-9_-]{0,63}$/);
    expect(isOpaqueId(event.subject.leadId)).toBe(true);
    expect(isOpaqueId(event.subject.locationId ?? "")).toBe(true);
  });

  it("keeps a UUIDv7's time in its first 48 bits and is a function of the context", () => {
    const id = uuidV7(ctx.at, ctx.idempotencyKey);
    expect(Number.parseInt(id.replaceAll("-", "").slice(0, 12), 16)).toBe(ctx.at.getTime());
    expect(uuidV7(ctx.at, ctx.idempotencyKey)).toBe(id);
    expect(uuidV7(ctx.at, "another key")).not.toBe(id);
  });

  it("keeps what the customer typed out of properties, and NUL out of everything", () => {
    const [event] = leadCreatedBody({ ...lead, mobile: "06\u000012", subject: "other", locality: "" }, ctx, OPTS).events;
    expect(event.properties).toEqual({ channel: "form" });
    expect(event.pii).toEqual({ phone: "0612", need: "Autre chose" });
    expect(JSON.stringify(event)).not.toContain("\\u0000");
  });

  it("sends a callback as `form` until the panel takes the channel", () => {
    const [event] = leadCreatedBody({ ...lead, channel: "callback", consent: { text: "J’accepte…", at: "2026-10-01T09:30:00Z" } }, ctx, OPTS).events;
    expect(event.properties).toEqual({ channel: "form" });
    // The consent is the lead's record, not the panel's.
    expect(JSON.stringify(event)).not.toContain("J’accepte");
  });

  it("names the job in French for the panel, and keeps a job no longer offered as posted", () => {
    const need = (subject: string) => leadCreatedBody({ ...lead, subject }, { ...ctx, locale: "en" }, OPTS).events[0].pii?.need;
    expect(need("hot_water")).toBe("Eau chaude");
    expect(need("gas_leak")).toBe("gas_leak");
  });

  it("carries `suspect` only when the kit says why, and nothing else of the verdict", () => {
    const [plain] = leadCreatedBody({ ...lead, spamVerdict: "too-fast" }, ctx, OPTS).events;
    expect(plain.properties).toEqual({ channel: "form" });
    const [marked] = leadCreatedBody({ ...lead, spamVerdict: "too-fast" }, { ...ctx, suspect: "too_fast" }, OPTS).events;
    expect(marked.properties).toEqual({ channel: "form", suspect: "too_fast" });
  });

  it("leaves the location out for a lead from no point", () => {
    const [event] = leadCreatedBody({ ...lead, placeSlug: null }, ctx, OPTS).events;
    expect(event.subject).toEqual({ brandId: "aquafix", leadId: LEAD_ID });
  });

  it("sends kitstart's leadRef as the panel's lead id, whatever the per-lead key", () => {
    expect(panelLeadId(ctx)).toBe(LEAD_ID);
    expect(panelLeadId({ ...ctx, idempotencyKey: "5e7a2c10-1b3d-4f6e-8a9b-0c1d2e3f4a5b" })).toBe(LEAD_ID);
    expect(isOpaqueId(LEAD_ID)).toBe(true);
  });

  it("falls back to the same shape, unique past a recreated leads file, for a context without a ref", () => {
    const bare = { leadId: 42, idempotencyKey: ctx.idempotencyKey };
    expect(panelLeadId(bare)).toMatch(/^lead-42-[0-9a-f]{8}$/);
    expect(panelLeadId(bare)).toBe(panelLeadId(bare));
    expect(panelLeadId({ ...bare, idempotencyKey: "5e7a2c10-1b3d-4f6e-8a9b-0c1d2e3f4a5b" })).not.toBe(panelLeadId(bare));
    expect(isOpaqueId(panelLeadId({ leadId: 12345678, idempotencyKey: ctx.idempotencyKey }))).toBe(true);
  });

  it("refuses ids the panel takes for phone numbers", () => {
    expect(isOpaqueId("lead-1234567")).toBe(true);
    expect(isOpaqueId("1234567")).toBe(false);
    expect(isOpaqueId("06.12.34.56.78")).toBe(false);
    expect(isOpaqueId("+33612345678")).toBe(false);
  });

  it("gives every point a slug the panel accepts as a location id", () => {
    for (const slug of site.placeSlugs) expect(isOpaqueId(slug), slug).toBe(true);
  });
});

describe("the lead webhook, wired as the site wires it", () => {
  let dir: string | undefined;
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
    dir = undefined;
  });

  it("is off without LEAD_WEBHOOK_URL", () => {
    dir = mkdtempSync(join(tmpdir(), "aquafix-hook-"));
    const env = parseServerEnv(site, { LEADS_DB_PATH: join(dir, "leads.db") });
    expect(env.leadWebhook).toBeNull();
  });

  it("posts the event signed the way the panel verifies it", async () => {
    dir = mkdtempSync(join(tmpdir(), "aquafix-hook-"));
    const env = parseServerEnv(site, {
      LEADS_DB_PATH: join(dir, "leads.db"),
      LEAD_WEBHOOK_URL: "http://127.0.0.1:59120/api/ingest/v1/events",
      LEAD_WEBHOOK_KEY_ID: "aquafix-site",
      LEAD_WEBHOOK_SECRET: "test-secret",
    });
    const target = env.leadWebhook;
    if (!target) throw new Error("the webhook should be on");
    const sent: Request[] = [];
    const hook = leadWebhook(site, env, {
      ...webhookOptions(target.keyId),
      fetch: async (input, init) => {
        sent.push(new Request(input, init));
        return new Response(JSON.stringify({ results: [{ index: 0, status: "accepted" }] }), { status: 207 });
      },
      log: { info: () => {}, warn: () => {}, error: () => {} },
    });
    if (!hook) throw new Error("the webhook should be on");
    try {
      hook.enqueue(lead, 7, { locale: "fr", formId: "quote" });
      expect(await hook.tick()).toMatchObject({ delivered: 1 });
    } finally {
      hook.close();
    }

    const [request] = sent;
    if (!request) throw new Error("nothing was sent");
    const raw = await request.text();
    const timestamp = request.headers.get("x-sa-timestamp") ?? "";
    expect(request.headers.get("x-sa-key-id")).toBe("aquafix-site");
    expect(request.headers.get("x-sa-signature")).toBe(
      createHmac("sha256", "test-secret").update(`sa-ingest/v1.${timestamp}.${raw}`).digest("hex"),
    );
    const body: unknown = JSON.parse(raw);
    // An array in toMatchObject must match in length: one event, no more.
    expect(body).toMatchObject({
      events: [
        {
          source: { kind: "site", id: "aquafix-site" },
          subject: { brandId: "aquafix", locationId: "royat", leadId: expect.stringMatching(/^lead-7-[0-9a-f]{8}$/) },
        },
      ],
    });
  });

  // A booking joins its lead by the reference the page was answered with; the
  // panel must have been told the lead under that same id.
  it("names the lead in lead.created by the reference the page was answered with", async () => {
    dir = mkdtempSync(join(tmpdir(), "aquafix-hook-"));
    const env = parseServerEnv(site, {
      LEADS_DB_PATH: join(dir, "leads.db"),
      LEAD_WEBHOOK_URL: "http://127.0.0.1:59120/api/ingest/v1/events",
      LEAD_WEBHOOK_KEY_ID: "aquafix-site",
      LEAD_WEBHOOK_SECRET: "test-secret",
    });
    const bodies: string[] = [];
    const hook = leadWebhook(site, env, {
      ...webhookOptions("aquafix-site"),
      fetch: async (_input, init) => {
        bodies.push(String(init?.body));
        return new Response(JSON.stringify({ results: [{ index: 0, status: "accepted" }] }), { status: 207 });
      },
      log: { info: () => {}, warn: () => {}, error: () => {} },
    });
    if (!hook) throw new Error("the webhook should be on");
    const now = Date.parse("2026-10-04T08:00:00Z");
    const form = new FormData();
    for (const [name, value] of Object.entries({
      job: "blocked_drain",
      zip: "63130",
      mobile: "06 12 34 56 78",
      [LOCATION_FIELD]: "royat",
      [LOCALE_FIELD]: "fr",
      [FORM_ID_FIELD]: "quote",
      [RENDERED_AT_FIELD]: String(now - 60_000),
      [SUBMISSION_FIELD]: "0d6f6a1e-2b7c-4c55-9e0f-6b1f5c3a7d21",
    }))
      form.set(name, value);
    try {
      const outcome = await createAcceptLead(site)(form, "198.51.100.7", {
        insert: async () => 7,
        defer: () => {},
        notify: async () => {},
        enqueue: (l, id, meta) => hook.enqueue(l, id, meta),
        capture: () => {},
        limiter: new RateLimiter(100, 60_000),
        now,
        log: { warn: () => {}, error: () => {} },
      });
      if (outcome.kind !== "stored") throw new Error(`the lead should be stored, was ${outcome.kind}`);
      expect(outcome.ref).toMatch(/^lead-7-[0-9a-f]{8}$/);
      expect(await hook.tick()).toMatchObject({ delivered: 1 });
      expect(bodies).toHaveLength(1);
      expect(JSON.parse(bodies[0] ?? "")).toMatchObject({ events: [{ subject: { leadId: outcome.ref } }] });
    } finally {
      hook.close();
    }
  });

  /**
   * A lead of each verdict through the webhook as the site builds it, and the
   * `suspect` each body carried to the receiver, by row id.
   */
  async function suspects(panelSuspect?: boolean): Promise<{ on: boolean; said: Record<string, string | null> }> {
    dir = mkdtempSync(join(tmpdir(), "aquafix-hook-"));
    const env: ServerEnv = parseServerEnv(site, {
      LEADS_DB_PATH: join(dir, "leads.db"),
      LEAD_WEBHOOK_URL: "http://127.0.0.1:59120/api/ingest/v1/events",
      LEAD_WEBHOOK_KEY_ID: "aquafix-site",
      LEAD_WEBHOOK_SECRET: "test-secret",
    });
    const said: Record<string, string | null> = {};
    const hook = leadWebhook(site, env, {
      ...webhookOptions("aquafix-site", panelSuspect),
      fetch: async (_input, init) => {
        const raw = String(init?.body);
        const row = /"leadId":"lead-(\d+)-/.exec(raw)?.[1] ?? "?";
        said[row] = /"suspect":"([a-z_]+)"/.exec(raw)?.[1] ?? null;
        return new Response(JSON.stringify({ results: [{ index: 0, status: "accepted" }] }), { status: 207 });
      },
      log: { info: () => {}, warn: () => {}, error: () => {} },
    });
    if (!hook) throw new Error("the webhook should be on");
    const verdicts: (SpamVerdict | null)[] = [null, "too-fast", "rate-limited", "honeypot"];
    try {
      verdicts.forEach((spamVerdict, i) => hook.enqueue({ ...lead, spamVerdict }, i + 1, { locale: "fr", formId: "quote" }));
      expect(await hook.tick()).toMatchObject({ delivered: verdicts.length });
    } finally {
      hook.close();
    }
    return { on: hook.panelSuspect, said };
  }

  // The panel refuses an unknown property, and the outbox would park the lead.
  it("keeps the panel's suspect marker off, so no body carries it", async () => {
    expect(PANEL_SUSPECT).toBe(false);
    expect(await suspects()).toEqual({ on: false, said: { 1: null, 2: null, 3: null, 4: null } });
  });

  it("sends why a lead is suspect once turned on — rate_limited or too_fast, never honeypot", async () => {
    expect(await suspects(true)).toEqual({ on: true, said: { 1: null, 2: "too_fast", 3: "rate_limited", 4: null } });
  });
});

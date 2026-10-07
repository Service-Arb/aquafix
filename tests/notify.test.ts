import { createServer, type Server } from "node:net";
import type { Lead } from "@evinvest/kitstart";
import { leadNotifier, parseServerEnv } from "@evinvest/kitstart/server";
import { afterEach, describe, expect, it } from "vitest";
import { JOB_IDS } from "@/shared/config/lead";
import { site } from "@/shared/config/site";
import { jobLabelFr, NOTIFIER_OPTIONS } from "@/features/quote-form/server";

const lead: Lead = {
  subject: "hot_water",
  locality: "63130",
  mobile: "+33612345678",
  extras: {},
  placeSlug: "royat",
  spamVerdict: null,
};

/**
 * Just enough of an SMTP server on loopback to take one message: the kit's
 * client needs no TLS there. Resolves each message's body, decoded.
 */
function smtpSink(): { server: Server; port: () => number; bodies: string[] } {
  const bodies: string[] = [];
  const server = createServer(socket => {
    let data: string | null = null;
    socket.write("220 sink\r\n");
    socket.on("data", chunk => {
      for (const line of chunk.toString("utf8").split("\r\n")) {
        if (data !== null) {
          if (line === ".") {
            const [, body = ""] = data.split("\r\n\r\n");
            bodies.push(Buffer.from(body.replaceAll("\r\n", ""), "base64").toString("utf8"));
            data = null;
            socket.write("250 queued\r\n");
          } else data += `${line}\r\n`;
          continue;
        }
        if (line === "") continue;
        const verb = line.slice(0, 4).toUpperCase();
        if (verb === "DATA") {
          data = "";
          socket.write("354 go\r\n");
        } else if (verb === "QUIT") socket.end("221 bye\r\n");
        else socket.write("250 ok\r\n");
      }
    });
  });
  const port = (): number => {
    const address = server.address();
    if (address === null || typeof address === "string") throw new Error("the sink is not listening on TCP");
    return address.port;
  };
  return { server, port, bodies };
}

describe("the lead mail", () => {
  let server: Server | undefined;
  afterEach(() => {
    server?.close();
    server = undefined;
  });

  it("has a French label for every job the form offers, and none for a stale one", () => {
    for (const id of JOB_IDS) expect(jobLabelFr(id), id).toMatch(/\S/);
    expect(jobLabelFr("gas_leak")).toBeUndefined();
  });

  // kitstart 0.11 hands the brand's `format` the need's label; the mail used to print `hot_water`.
  it("names the job in French through kitstart's needLabel, and a stale job by its id", async () => {
    const sink = smtpSink();
    server = sink.server;
    await new Promise<void>(resolve => sink.server.listen(0, "127.0.0.1", resolve));
    const env = parseServerEnv(site, {
      LEADS_DB_PATH: "/tmp/unused-aquafix-leads.db",
      SMTP_URL: `smtp://127.0.0.1:${sink.port()}`,
      LEAD_NOTIFY_TO: "owner@example.test",
      LEAD_NOTIFY_FROM: "leads@example.test",
    });
    const mail = leadNotifier(site, env, NOTIFIER_OPTIONS);
    await mail.notify(lead, 7);
    await mail.notify({ ...lead, subject: "gas_leak" }, 8);

    expect(sink.bodies).toHaveLength(2);
    expect(sink.bodies[0]).toContain("Demande #7 — point royat");
    expect(sink.bodies[0]).toContain("Intervention : Eau chaude");
    expect(sink.bodies[0]).not.toContain("hot_water");
    expect(sink.bodies[1]).toContain("Intervention : gas_leak");
  });

  // lead_form c posts how urgent the job is; the business reads it in the form's words.
  it("names the urgency in French, and an unknown one as posted", async () => {
    const sink = smtpSink();
    server = sink.server;
    await new Promise<void>(resolve => sink.server.listen(0, "127.0.0.1", resolve));
    const env = parseServerEnv(site, {
      LEADS_DB_PATH: "/tmp/unused-aquafix-leads.db",
      SMTP_URL: `smtp://127.0.0.1:${sink.port()}`,
      LEAD_NOTIFY_TO: "owner@example.test",
      LEAD_NOTIFY_FROM: "leads@example.test",
    });
    const mail = leadNotifier(site, env, NOTIFIER_OPTIONS);
    await mail.notify({ ...lead, extras: { urgency: "today" } }, 9);
    await mail.notify({ ...lead, extras: { urgency: "someday" } }, 10);

    expect(sink.bodies[0]).toContain("Urgence      : Urgent — aujourd’hui");
    expect(sink.bodies[1]).toContain("Urgence      : someday");
  });

  // lead_channel g posts `later` for "Non, je compare": the kit's word, not one of lead_form c's.
  it("names lead_channel g's not-urgent answer in French", async () => {
    const sink = smtpSink();
    server = sink.server;
    await new Promise<void>(resolve => sink.server.listen(0, "127.0.0.1", resolve));
    const env = parseServerEnv(site, {
      LEADS_DB_PATH: "/tmp/unused-aquafix-leads.db",
      SMTP_URL: `smtp://127.0.0.1:${sink.port()}`,
      LEAD_NOTIFY_TO: "owner@example.test",
      LEAD_NOTIFY_FROM: "leads@example.test",
    });
    const mail = leadNotifier(site, env, NOTIFIER_OPTIONS);
    await mail.notify({ ...lead, channel: "whatsapp", messageRef: "AQ-7K3F", extras: { urgency: "later" } }, 11);

    expect(sink.bodies[0]).toContain("Urgence      : Pas urgent — compare");
    expect(sink.bodies[0]).not.toContain("later");
  });
});

describe("a messenger lead's mail", () => {
  let server: Server | undefined;
  afterEach(() => {
    server?.close();
    server = undefined;
  });

  const shown = { need: "Eau chaude" };

  it("says WhatsApp in the subject", () => {
    expect(NOTIFIER_OPTIONS.format({ ...lead, channel: "whatsapp", messageRef: "AQ-7K3F" }, 12, shown).subject).toBe(
      "Aquafix — nouvelle demande WhatsApp (royat)",
    );
  });

  it("says Telegram in the subject", () => {
    expect(NOTIFIER_OPTIONS.format({ ...lead, channel: "telegram", messageRef: "AQ-M4X9" }, 13, shown).subject).toBe(
      "Aquafix — nouvelle demande Telegram (royat)",
    );
  });

  it("keeps a form lead's and a callback's subject as it was", () => {
    expect(NOTIFIER_OPTIONS.format(lead, 14, shown).subject).toBe("Aquafix — nouvelle demande (royat)");
    expect(NOTIFIER_OPTIONS.format({ ...lead, channel: "callback" }, 15, shown).subject).toBe("Aquafix — nouvelle demande (royat)");
  });

  it("prints the channel and the reference the operator matches the chat by, through the kit's mailer", async () => {
    const sink = smtpSink();
    server = sink.server;
    await new Promise<void>(resolve => sink.server.listen(0, "127.0.0.1", resolve));
    const env = parseServerEnv(site, {
      LEADS_DB_PATH: "/tmp/unused-aquafix-leads.db",
      SMTP_URL: `smtp://127.0.0.1:${sink.port()}`,
      LEAD_NOTIFY_TO: "owner@example.test",
      LEAD_NOTIFY_FROM: "leads@example.test",
    });
    const mail = leadNotifier(site, env, NOTIFIER_OPTIONS);
    await mail.notify({ ...lead, mobile: "", locality: "", channel: "whatsapp", messageRef: "AQ-7K3F" }, 16);
    await mail.notify({ ...lead, channel: "telegram", messageRef: "AQ-M4X9" }, 17);
    await mail.notify(lead, 18);

    expect(sink.bodies).toHaveLength(3);
    expect(sink.bodies[0]).toContain("Canal        : WhatsApp — le client vous écrit");
    expect(sink.bodies[0]).toContain("Réf.         : AQ-7K3F");
    expect(sink.bodies[1]).toContain("Canal        : Telegram — le client vous écrit");
    expect(sink.bodies[1]).toContain("Réf.         : AQ-M4X9");
    expect(sink.bodies[2]).not.toContain("Canal");
    expect(sink.bodies[2]).not.toContain("Réf.");
  });
});

import "server-only";
import { connect as tcp, type Socket } from "node:net";
import { connect as tlsConnect, type TLSSocket } from "node:tls";

/**
 * A minimal SMTP submission client: one message, plain text, AUTH PLAIN,
 * STARTTLS when offered. Enough to tell a plumber a lead arrived, without a
 * mail library in the dependency tree.
 *
 * `smtps://user:pass@host:465` is implicit TLS; `smtp://…:587` upgrades with
 * STARTTLS when the server offers it (and refuses to send credentials in the
 * clear when it does not, unless the host is loopback — a local catcher).
 */
export interface Mail {
  from: string;
  to: string;
  subject: string;
  text: string;
}

const TIMEOUT_MS = 10_000;

class Replies {
  private buffer = "";
  private waiting: ((reply: { code: number; text: string }) => void)[] = [];
  private queued: { code: number; text: string }[] = [];

  private readonly onData = (chunk: Buffer) => this.feed(chunk.toString("utf8"));

  constructor(private socket: Socket | TLSSocket) {
    socket.on("data", this.onData);
  }

  private feed(data: string): void {
    this.buffer += data;
    let end: number;
    let lines: string[] = [];
    while ((end = this.buffer.indexOf("\r\n")) >= 0) {
      const line = this.buffer.slice(0, end);
      this.buffer = this.buffer.slice(end + 2);
      lines.push(line);
      // `250-…` continues a reply, `250 …` ends it.
      if (/^\d{3}(?: |$)/.test(line)) {
        const reply = { code: Number(line.slice(0, 3)), text: lines.join("\n") };
        lines = [];
        const next = this.waiting.shift();
        if (next) next(reply);
        else this.queued.push(reply);
      }
    }
    if (lines.length) this.buffer = `${lines.join("\r\n")}\r\n${this.buffer}`;
  }

  next(): Promise<{ code: number; text: string }> {
    const ready = this.queued.shift();
    if (ready) return Promise.resolve(ready);
    return new Promise(resolve => this.waiting.push(resolve));
  }

  /** Before STARTTLS: the raw socket is about to carry ciphertext. */
  detach(): void {
    this.socket.off("data", this.onData);
    this.buffer = "";
    this.queued = [];
  }

  attach(socket: Socket | TLSSocket): void {
    this.socket = socket;
    socket.on("data", this.onData);
  }
}

function encodeHeader(value: string): string {
  // RFC 2047: a subject with an accent or a place name is not 7-bit.
  return /^[\x20-\x7e]*$/.test(value) ? value : `=?UTF-8?B?${Buffer.from(value, "utf8").toString("base64")}?=`;
}

function message(mail: Mail): string {
  const body = Buffer.from(mail.text, "utf8").toString("base64").replace(/.{76}/g, "$&\r\n");
  return [
    `From: ${mail.from}`,
    `To: ${mail.to}`,
    `Subject: ${encodeHeader(mail.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: base64",
    "",
    body,
  ].join("\r\n");
}

async function open(url: URL): Promise<Socket | TLSSocket> {
  const implicit = url.protocol === "smtps:";
  const port = Number(url.port || (implicit ? 465 : 587));
  const socket = implicit
    ? tlsConnect({ host: url.hostname, port, servername: url.hostname })
    : tcp({ host: url.hostname, port });
  socket.setTimeout(TIMEOUT_MS, () => socket.destroy(new Error("smtp: timed out")));
  await new Promise<void>((resolve, reject) => {
    socket.once(implicit ? "secureConnect" : "connect", () => resolve());
    socket.once("error", reject);
  });
  return socket;
}

export async function sendMail(smtpUrl: string, mail: Mail): Promise<void> {
  const url = new URL(smtpUrl);
  if (url.protocol !== "smtp:" && url.protocol !== "smtps:") throw new Error(`smtp: unsupported scheme ${url.protocol}`);
  let socket = await open(url);
  const replies = new Replies(socket);
  let fail: (e: Error) => void = () => undefined;
  const failed = new Promise<never>((_, reject) => (fail = reject));
  // Handled here so an error after the last exchange is not an unhandled
  // rejection; every `expect` still races against it.
  failed.catch(() => undefined);
  socket.on("error", fail);
  const expect = async (ok: (code: number) => boolean, what: string) => {
    const reply = await Promise.race([replies.next(), failed]);
    if (!ok(reply.code)) throw new Error(`smtp: ${what} refused: ${reply.text}`);
    return reply;
  };
  const say = (line: string) => socket.write(`${line}\r\n`);
  const hello = url.hostname.includes(".") ? "aquafix.top" : "localhost";
  try {
    await expect(c => c === 220, "greeting");
    say(`EHLO ${hello}`);
    const caps = await expect(c => c === 250, "EHLO");
    let encrypted = url.protocol === "smtps:";
    if (!encrypted && /STARTTLS/i.test(caps.text)) {
      say("STARTTLS");
      await expect(c => c === 220, "STARTTLS");
      replies.detach();
      socket = tlsConnect({ socket, servername: url.hostname });
      await new Promise<void>((resolve, reject) => {
        socket.once("secureConnect", () => resolve());
        socket.once("error", reject);
      });
      socket.on("error", fail);
      encrypted = true;
      replies.attach(socket);
      say(`EHLO ${hello}`);
      await expect(c => c === 250, "EHLO after STARTTLS");
    }
    if (url.username) {
      const loopback = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
      if (!encrypted && !loopback) {
        throw new Error("smtp: refusing to send credentials without TLS");
      }
      const plain = Buffer.from(`\0${decodeURIComponent(url.username)}\0${decodeURIComponent(url.password)}`).toString("base64");
      say(`AUTH PLAIN ${plain}`);
      await expect(c => c === 235, "AUTH");
    }
    say(`MAIL FROM:<${mail.from}>`);
    await expect(c => c === 250, "MAIL FROM");
    say(`RCPT TO:<${mail.to}>`);
    await expect(c => c === 250 || c === 251, "RCPT TO");
    say("DATA");
    await expect(c => c === 354, "DATA");
    // Dot-stuffing: a line that starts with "." would otherwise end the data.
    say(`${message(mail).replace(/\r\n\./g, "\r\n..")}\r\n.`);
    await expect(c => c === 250, "message");
    say("QUIT");
  } finally {
    socket.end();
  }
}

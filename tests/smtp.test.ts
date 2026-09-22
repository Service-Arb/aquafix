import { createServer, type AddressInfo, type Server } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { sendMail } from "@/shared/lib/smtp";

let server: Server | undefined;
afterEach(() => new Promise<void>(resolve => (server ? server.close(() => resolve()) : resolve())));

/** A scripted SMTP peer on loopback that records what it was told. */
function fakeSmtp(opts: { rcpt?: string } = {}): Promise<{ port: number; lines: string[] }> {
  const lines: string[] = [];
  server = createServer(socket => {
    let inData = false;
    let buffer = "";
    socket.write("220 fake ESMTP\r\n");
    socket.on("data", chunk => {
      buffer += chunk.toString("utf8");
      let end: number;
      while ((end = buffer.indexOf("\r\n")) >= 0) {
        const line = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        lines.push(line);
        if (inData) {
          if (line === ".") {
            inData = false;
            socket.write("250 queued\r\n");
          }
          continue;
        }
        if (line.startsWith("EHLO")) socket.write("250-fake\r\n250 AUTH PLAIN\r\n");
        else if (line.startsWith("AUTH PLAIN")) socket.write("235 ok\r\n");
        else if (line.startsWith("MAIL FROM")) socket.write("250 ok\r\n");
        else if (line.startsWith("RCPT TO")) socket.write(opts.rcpt ?? "250 ok\r\n");
        else if (line === "DATA") {
          inData = true;
          socket.write("354 go\r\n");
        } else if (line === "QUIT") socket.end("221 bye\r\n");
      }
    });
  });
  return new Promise(resolve =>
    server!.listen(0, "127.0.0.1", () => resolve({ port: (server!.address() as AddressInfo).port, lines })),
  );
}

const mail = { from: "leads@aquafix.top", to: "val@aquafix.top", subject: "Aquafix — nouvelle demande", text: "Demande #1" };

describe("the SMTP client", () => {
  it("delivers one message with auth, an encoded subject and a base64 body", async () => {
    const { port, lines } = await fakeSmtp();
    await sendMail(`smtp://user:secret@127.0.0.1:${port}`, mail);
    expect(lines).toContain(`AUTH PLAIN ${Buffer.from("\0user\0secret").toString("base64")}`);
    expect(lines).toContain("RCPT TO:<val@aquafix.top>");
    expect(lines.some(l => l.startsWith("Subject: =?UTF-8?B?"))).toBe(true);
    expect(lines).toContain(Buffer.from("Demande #1").toString("base64"));
  });

  it("fails loudly when the server refuses the recipient", async () => {
    const { port } = await fakeSmtp({ rcpt: "550 no such user\r\n" });
    await expect(sendMail(`smtp://127.0.0.1:${port}`, mail)).rejects.toThrow(/RCPT TO refused/);
  });
});

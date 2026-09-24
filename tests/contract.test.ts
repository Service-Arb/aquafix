import { readFileSync } from "node:fs";
import { describeLandingContract } from "@evinvest/kitstart/testing";
import { text } from "@/entities/content";
import { OWNER_TODO, site } from "@/shared/config/site";

// kitstart's contract over this site: its matcher, the files it serves outside
// `[locale]`, Tailwind scanning the package, the copy, the owner's facts.
describeLandingContract(site, {
  globalsCss: readFileSync("app/globals.css", "utf8"),
  proxySource: readFileSync("proxy.ts", "utf8"),
  root: process.cwd(),
  text: { fr: text("fr"), en: text("en") },
  ownerTodo: OWNER_TODO,
});

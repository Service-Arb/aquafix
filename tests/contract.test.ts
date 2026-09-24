import { readFileSync } from "node:fs";
import { describeLandingContract } from "@evinvest/kitstart/testing";
import { text } from "@/entities/content";
import { OWNER_TODO, site } from "@/shared/config/site";

// kitstart's contract over this site. Not `proxySource`: proxy.ts keeps its
// own matcher, which lets paths with an extension in (see proxy.ts).
describeLandingContract(site, {
  globalsCss: readFileSync("app/globals.css", "utf8"),
  text: { fr: text("fr"), en: text("en") },
  ownerTodo: OWNER_TODO,
});

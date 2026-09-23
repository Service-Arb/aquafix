export type { LeadStore } from "@/shared/landing/core/lead";
export { openLeadStore, type LeadDb } from "@/shared/landing/server/lead-store";
export { LEAD_SCHEMA_VERSION, openSqliteLeadStore, type SqliteLeadStore } from "@/shared/landing/server/lead-store-sqlite";
export { leadNotifier, type LeadNotifier } from "./api/notify";
export { checkLeadStore } from "./api/boot";

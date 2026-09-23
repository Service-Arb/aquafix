import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { openLeadStore, openSqliteLeadStore } from "@/entities/lead/server";
import { parseServerEnv } from "@/shared/config/env";
import { parseLeadDb } from "@/shared/landing/server/lead-store";
import { describeLeadStoreContract } from "./support/lead-store-contract";

const tmp = () => join(mkdtempSync(join(tmpdir(), "aquafix-contract-")), "leads.db");

describeLeadStoreContract("sqlite (file)", () => {
  const path = tmp();
  return {
    open: async () => openSqliteLeadStore(path),
    reopen: async () => openSqliteLeadStore(path),
  };
});

describeLeadStoreContract("sqlite (selected by LEADS_DB_URL)", () => {
  const url = `sqlite://${tmp()}`;
  return {
    open: async () => openLeadStore(parseLeadDb(url)),
    reopen: async () => openLeadStore(parseLeadDb(url)),
  };
});

describe("choosing the lead store", () => {
  it("reads the adapter off the scheme of LEADS_DB_URL", () => {
    expect(parseLeadDb("sqlite:///data/leads.db")).toEqual({ kind: "sqlite", path: "/data/leads.db" });
    expect(() => parseLeadDb("sqlite:leads.db")).toThrow(/absolute/);
    expect(() => parseLeadDb("postgres://u:p@db/leads")).toThrow(/postgres adapter is not implemented/);
    expect(() => parseLeadDb("postgresql://db/leads")).toThrow(/postgres adapter is not implemented/);
    expect(() => parseLeadDb("mysql://db/leads")).toThrow(/unsupported scheme/);
  });

  it("keeps the deployed LEADS_DB_PATH working, and lets LEADS_DB_URL win", () => {
    const prod = { NODE_ENV: "production" };
    expect(parseServerEnv({ ...prod, LEADS_DB_PATH: "/data/leads.db" }).leadsDb).toEqual({
      kind: "sqlite",
      path: "/data/leads.db",
    });
    expect(
      parseServerEnv({ ...prod, LEADS_DB_PATH: "/data/leads.db", LEADS_DB_URL: "sqlite:///data/v2.db" }).leadsDb,
    ).toEqual({ kind: "sqlite", path: "/data/v2.db" });
  });

  it("refuses to boot in production with neither, or with an adapter that does not exist yet", () => {
    expect(() => parseServerEnv({ NODE_ENV: "production" })).toThrow(/LEADS_DB_URL or LEADS_DB_PATH is required/);
    expect(() => parseServerEnv({ NODE_ENV: "production", LEADS_DB_PATH: " " })).toThrow(/required/);
    expect(() => parseServerEnv({ NODE_ENV: "production", LEADS_DB_URL: "postgres://db/leads" })).toThrow(/postgres/);
  });
});

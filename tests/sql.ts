import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import type { Sql, SqlRow } from "../shared/inquiry/types";

export function createTestSql(): Sql {
  const db = new DatabaseSync(":memory:");
  db.exec(readFileSync(new URL("../migrations/0001_inquiries.sql", import.meta.url), "utf8"));
  return {
    async get<T extends SqlRow>(query: string, ...params: unknown[]) {
      const row = db.prepare(query).get(...(params as Array<string | number | null>)) as T | undefined;
      return row ?? null;
    },
    async all<T extends SqlRow>(query: string, ...params: unknown[]) {
      return db.prepare(query).all(...(params as Array<string | number | null>)) as unknown as T[];
    },
    async run(query: string, ...params: unknown[]) {
      db.prepare(query).run(...(params as Array<string | number | null>));
    },
  };
}

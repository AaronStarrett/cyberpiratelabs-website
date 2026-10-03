import { readFileSync, readdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import type { Sql, SqlRow } from "../shared/inquiry/types";

export function createTestSql(): Sql {
  const db = new DatabaseSync(":memory:");
  for (const filename of readdirSync(new URL("../migrations/", import.meta.url)).filter(name => name.endsWith(".sql")).sort()) {
    db.exec(readFileSync(new URL("../migrations/" + filename, import.meta.url), "utf8"));
  }
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

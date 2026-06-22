import { PostgresStore } from "@mastra/pg";
import { db } from "@labq-modules/db";
import { env } from "@labq-modules/env/server";
import { sql } from "drizzle-orm";

export const MASTRA_SCHEMA_NAME = "mastra";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function quoteIdentifier(identifier: string) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

function extractTableNames(result: unknown) {
  if (!isRecord(result) || !Array.isArray(result.rows)) {
    return [] as string[];
  }

  const names: string[] = [];
  for (const row of result.rows) {
    if (isRecord(row) && typeof row.table_name === "string") {
      names.push(row.table_name);
    }
  }
  return names;
}

async function listMastraTables(schemaName: string) {
  const result = await db.execute(
    sql.raw(`
			SELECT table_name
			FROM information_schema.tables
			WHERE table_schema = '${schemaName}'
				AND table_name LIKE 'mastra\\_%' ESCAPE '\\'
			ORDER BY table_name
		`),
  );

  return extractTableNames(result);
}

export async function ensureMastraSchemaSeparation() {
  await db.execute(sql.raw(`CREATE SCHEMA IF NOT EXISTS ${quoteIdentifier(MASTRA_SCHEMA_NAME)}`));

  const publicMastraTables = await listMastraTables("public");
  if (publicMastraTables.length === 0) {
    return;
  }

  const mastraSchemaTables = new Set(await listMastraTables(MASTRA_SCHEMA_NAME));
  for (const tableName of publicMastraTables) {
    if (mastraSchemaTables.has(tableName)) {
      continue;
    }

    await db.execute(
      sql.raw(
        `ALTER TABLE ${quoteIdentifier("public")}.${quoteIdentifier(tableName)} SET SCHEMA ${quoteIdentifier(MASTRA_SCHEMA_NAME)}`,
      ),
    );
  }
}

export function createMastraStore() {
  return new PostgresStore({
    id: "labq-postgres-storage",
    connectionString: env.DATABASE_URL,
    schemaName: MASTRA_SCHEMA_NAME,
  });
}

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "./db-instance";
import { organizationSettings } from "@admin-template/db/schema/business";

const now = () => new Date();

/**
 * Insert initial workspace tables inside a transaction.
 * Used by the onboarding create-org flow — no existence checks.
 */
export async function insertInitialWorkspaceTables(
  database: { insert: typeof db.insert },
  orgId: string,
  _userId: string,
  timestamp: Date,
): Promise<void> {
  await database.insert(organizationSettings).values({
    id: randomUUID(),
    organizationId: orgId,
    currency: "IDR",
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

/**
 * Legacy idempotent seeder — checks existence before inserting.
 */
export async function seedWorkspaceTables(orgId: string, _userId: string): Promise<void> {
  const timestamp = now();

  const existingSettings = await db.query.organizationSettings.findFirst({
    where: eq(organizationSettings.organizationId, orgId),
  });
  if (!existingSettings) {
    await db.insert(organizationSettings).values({
      id: randomUUID(),
      organizationId: orgId,
      currency: "IDR",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }
}

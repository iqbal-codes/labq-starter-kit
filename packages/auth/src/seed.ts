import { randomUUID } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "./db-instance";
import {
  dealStages,
  organizationSettings,
} from "@labq-modules/db/schema/business";

const now = () => new Date();

export const DEFAULT_DEAL_STAGES = [
  { name: "New", kind: "open" as const },
  { name: "Qualified", kind: "open" as const },
  { name: "Proposal", kind: "open" as const },
  { name: "Won", kind: "won" as const },
  { name: "Lost", kind: "lost" as const },
];

/**
 * Insert initial workspace tables inside a transaction.
 * Used by the onboarding create-org flow — no existence checks.
 */
export async function insertInitialWorkspaceTables(
  database: { insert: typeof db.insert },
  orgId: string,
  userId: string,
  timestamp: Date,
): Promise<void> {
  await database.insert(organizationSettings).values({
    id: randomUUID(),
    organizationId: orgId,
    currency: "IDR",
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  for (let i = 0; i < DEFAULT_DEAL_STAGES.length; i++) {
    const stage = DEFAULT_DEAL_STAGES[i]!;
    await database.insert(dealStages).values({
      id: randomUUID(),
      organizationId: orgId,
      name: stage.name,
      kind: stage.kind,
      sortOrder: i,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: userId,
      updatedBy: userId,
    });
  }
}

/**
 * Legacy idempotent seeder — checks existence before inserting.
 */
export async function seedWorkspaceTables(orgId: string, userId: string): Promise<void> {
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

  for (let i = 0; i < DEFAULT_DEAL_STAGES.length; i++) {
    const stage = DEFAULT_DEAL_STAGES[i]!;
    const existingStage = await db.query.dealStages.findFirst({
      where: and(
        eq(dealStages.organizationId, orgId),
        eq(dealStages.name, stage.name),
        isNull(dealStages.deletedAt),
      ),
    });
    if (!existingStage) {
      await db.insert(dealStages).values({
        id: randomUUID(),
        organizationId: orgId,
        name: stage.name,
        kind: stage.kind,
        sortOrder: i,
        createdAt: timestamp,
        updatedAt: timestamp,
        createdBy: userId,
        updatedBy: userId,
      });
    }
  }
}

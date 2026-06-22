import { db } from "@labq-modules/db";
import { auditLogs } from "@labq-modules/db/schema/business";
import { randomUUID } from "node:crypto";

export interface AuditParams {
  organizationId: string;
  userId: string;
  moduleKey: string;
  entityType: string;
  entityId: string;
  action: string;
  metadata?: Record<string, unknown>;
}

export async function writeAudit(params: AuditParams): Promise<void> {
  await db.insert(auditLogs).values({
    id: randomUUID(),
    organizationId: params.organizationId,
    actorUserId: params.userId,
    moduleKey: params.moduleKey,
    entityType: params.entityType,
    entityId: params.entityId,
    action: params.action,
    metadata: params.metadata ? JSON.stringify(params.metadata) : null,
  });
}

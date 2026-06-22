import { randomUUID } from "node:crypto";
import { eq, and, isNull, desc } from "drizzle-orm";
import { db } from "@labq-modules/db";
import { attachments, contacts } from "@labq-modules/db/schema/business";
import { user } from "@labq-modules/db/schema/auth";
import { throwNotFound } from "./errors";
import type { ContactAttachmentItem } from "@labq-modules/schemas";
import type { attachments as AttachmentTable } from "@labq-modules/db/schema/business";

type AttachmentRow = typeof AttachmentTable.$inferSelect;

export function sanitizeAttachmentFileName(name: string): string {
  return name
    .replace(/[\\/]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 255);
}

export function buildAttachmentStorageKey(
  orgId: string,
  entityType: string,
  entityId: string,
  originalName: string,
): string {
  const sanitized = sanitizeAttachmentFileName(originalName);
  const ext = sanitized.includes(".") ? sanitized.slice(sanitized.lastIndexOf(".")) : "";
  const base = sanitized.includes(".") ? sanitized.slice(0, sanitized.lastIndexOf(".")) : sanitized;
  return `${orgId}/${entityType}/${entityId}/${randomUUID()}-${base}${ext}`;
}

export async function assertActiveContact(orgId: string, contactId: string): Promise<void> {
  const existing = await db.query.contacts.findFirst({
    where: and(
      eq(contacts.id, contactId),
      eq(contacts.organizationId, orgId),
      isNull(contacts.deletedAt),
    ),
  });
  if (!existing) throwNotFound("Contact");
}

export async function listContactAttachmentItems(
  orgId: string,
  contactId: string,
): Promise<ContactAttachmentItem[]> {
  const rows = await db
    .select({
      id: attachments.id,
      entityId: attachments.entityId,
      entityType: attachments.entityType,
      fileName: attachments.fileName,
      mimeType: attachments.mimeType,
      sizeBytes: attachments.sizeBytes,
      createdAt: attachments.createdAt,
      uploadedByName: user.name,
    })
    .from(attachments)
    .leftJoin(user, eq(attachments.createdBy, user.id))
    .where(
      and(
        eq(attachments.organizationId, orgId),
        eq(attachments.entityId, contactId),
        eq(attachments.entityType, "crm_contact"),
        isNull(attachments.deletedAt),
      ),
    )
    .orderBy(desc(attachments.createdAt));

  return rows.map((row) => ({
    id: row.id,
    entityId: row.entityId,
    entityType: row.entityType as "crm_contact",
    fileName: row.fileName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    uploadedByName: row.uploadedByName,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function getActiveContactAttachment(
  orgId: string,
  attachmentId: string,
): Promise<AttachmentRow> {
  const row = await db.query.attachments.findFirst({
    where: and(
      eq(attachments.id, attachmentId),
      eq(attachments.organizationId, orgId),
      isNull(attachments.deletedAt),
    ),
  });
  if (!row) throwNotFound("Attachment");
  return row;
}

export async function insertContactAttachmentRecord(params: {
  organizationId: string;
  contactId: string;
  storageKey: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  userId: string;
}): Promise<AttachmentRow> {
  const id = randomUUID();
  const [row] = await db
    .insert(attachments)
    .values({
      id,
      organizationId: params.organizationId,
      entityType: "crm_contact",
      entityId: params.contactId,
      storageKey: params.storageKey,
      fileName: params.fileName,
      mimeType: params.mimeType,
      sizeBytes: params.sizeBytes,
      createdBy: params.userId,
      updatedBy: params.userId,
    })
    .returning();
  return row!;
}

export async function softDeleteContactAttachmentRecord(
  orgId: string,
  attachmentId: string,
  userId: string,
): Promise<AttachmentRow> {
  const row = await getActiveContactAttachment(orgId, attachmentId);
  const [updated] = await db
    .update(attachments)
    .set({ deletedAt: new Date(), updatedBy: userId })
    .where(eq(attachments.id, attachmentId))
    .returning();
  return updated ?? row;
}

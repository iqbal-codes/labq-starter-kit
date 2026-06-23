import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@admin-template/db";
import { attachments } from "@admin-template/db/schema/business";
import { buildAttachmentStorageKey } from "./attachments";
import { AppError } from "./errors";
import { ensureS3BucketExists, getS3Client, S3_BUCKET } from "./s3";

export const OPERATIONS_ATTACHMENT_ENTITY_TYPES = {
  customerAvatar: "operations_customer_avatar",
  servicePhoto: "operations_service_photo",
} as const;

export type OperationsAttachmentEntityType =
  (typeof OPERATIONS_ATTACHMENT_ENTITY_TYPES)[keyof typeof OPERATIONS_ATTACHMENT_ENTITY_TYPES];

export type AttachmentMetadata = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  downloadUrl: string;
};

export async function listEntityAttachments(
  organizationId: string,
  entityType: OperationsAttachmentEntityType,
  entityId: string,
) {
  return db
    .select()
    .from(attachments)
    .where(
      and(
        eq(attachments.organizationId, organizationId),
        eq(attachments.entityType, entityType),
        eq(attachments.entityId, entityId),
        isNull(attachments.deletedAt),
      ),
    )
    .orderBy(desc(attachments.createdAt));
}

export async function getAttachmentById(organizationId: string, attachmentId: string) {
  const [attachment] = await db
    .select()
    .from(attachments)
    .where(
      and(
        eq(attachments.organizationId, organizationId),
        eq(attachments.id, attachmentId),
        isNull(attachments.deletedAt),
      ),
    )
    .limit(1);

  return attachment ?? null;
}

export function toAttachmentMetadata(attachment: {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}): AttachmentMetadata {
  return {
    id: attachment.id,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
    sizeBytes: attachment.sizeBytes,
    downloadUrl: `/api/operations/attachments/${attachment.id}`,
  };
}

export async function uploadEntityAttachment(params: {
  organizationId: string;
  entityType: OperationsAttachmentEntityType;
  entityId: string;
  userId: string;
  file: File;
}) {
  if (!params.file.name) {
    throw new AppError("VALIDATION_ERROR", "Uploaded file must have a name");
  }

  const id = randomUUID();
  const storageKey = buildAttachmentStorageKey(
    params.organizationId,
    params.entityType,
    params.entityId,
    params.file.name,
  );
  const bytes = Buffer.from(await params.file.arrayBuffer());
  const mimeType = params.file.type || "application/octet-stream";
  await ensureS3BucketExists();

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: storageKey,
      Body: bytes,
      ContentType: mimeType,
    }),
  );

  await db.insert(attachments).values({
    id,
    organizationId: params.organizationId,
    entityType: params.entityType,
    entityId: params.entityId,
    storageKey,
    fileName: params.file.name,
    mimeType,
    sizeBytes: params.file.size,
    createdBy: params.userId,
    updatedBy: params.userId,
  });

  const created = await getAttachmentById(params.organizationId, id);
  if (!created) {
    throw new AppError("INTERNAL_ERROR", "Attachment record could not be read after upload");
  }

  return created;
}

export async function deleteStoredAttachment(params: {
  organizationId: string;
  attachmentId: string;
  userId: string;
  entityType?: OperationsAttachmentEntityType;
  entityId?: string;
}) {
  const attachment = await getAttachmentById(params.organizationId, params.attachmentId);
  if (!attachment) {
    throw new AppError("NOT_FOUND", "Attachment not found");
  }
  if (params.entityType && attachment.entityType !== params.entityType) {
    throw new AppError("NOT_FOUND", "Attachment not found");
  }

  if (params.entityId && attachment.entityId !== params.entityId) {
    throw new AppError("NOT_FOUND", "Attachment not found");
  }

  await getS3Client().send(
    new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: attachment.storageKey,
    }),
  );

  await db
    .update(attachments)
    .set({
      deletedAt: new Date(),
      updatedBy: params.userId,
    })
    .where(eq(attachments.id, attachment.id));

  return attachment;
}

export async function getAttachmentBytes(organizationId: string, attachmentId: string) {
  const attachment = await getAttachmentById(organizationId, attachmentId);
  if (!attachment) {
    throw new AppError("NOT_FOUND", "Attachment not found");
  }

  const result = await getS3Client().send(
    new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: attachment.storageKey,
    }),
  );

  if (!result.Body) {
    throw new AppError("NOT_FOUND", "Attachment file not found");
  }

  const bytes = Buffer.from(await result.Body.transformToByteArray());
  return { attachment, bytes };
}

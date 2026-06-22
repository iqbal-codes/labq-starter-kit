import { randomUUID } from "node:crypto";

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

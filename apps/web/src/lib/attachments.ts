import type { ContactAttachmentItem } from "@labq-modules/schemas";

const API_URL =
  (import.meta as { env: Record<string, string | undefined> }).env.VITE_API_URL ||
  "http://localhost:4000";

export async function uploadContactAttachment(
  contactId: string,
  file: File,
): Promise<ContactAttachmentItem> {
  const body = new FormData();
  body.append("file", file);

  const response = await fetch(`${API_URL}/api/crm/contacts/${contactId}/attachments`, {
    method: "POST",
    body,
    credentials: "include",
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message = errorBody?.error ?? `Upload failed (${response.status})`;
    throw new Error(message);
  }

  return response.json();
}

export async function downloadAttachment(
  attachmentId: string,
  fallbackFileName: string,
): Promise<void> {
  const response = await fetch(`${API_URL}/api/crm/attachments/${attachmentId}/download`, {
    credentials: "include",
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message = errorBody?.error ?? `Download failed (${response.status})`;
    throw new Error(message);
  }

  const contentDisposition = response.headers.get("Content-Disposition");
  let fileName = fallbackFileName;
  if (contentDisposition) {
    const utf8FilenameMatch = contentDisposition.match(/filename\*=UTF-8''(.+)/);
    if (utf8FilenameMatch?.[1]) {
      fileName = decodeURIComponent(utf8FilenameMatch[1]);
    } else {
      const basicMatch = contentDisposition.match(/filename="?([^";\n]+)"?/);
      if (basicMatch?.[1]) {
        fileName = basicMatch[1];
      }
    }
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../../../runtime";
import { FileUploader } from "@labq-modules/ui/components/file-uploader";
import { Button } from "@labq-modules/ui/components/button";
import { usePermissions } from "../../../hooks/use-permissions";
import { uploadContactAttachment, downloadAttachment } from "../../../lib/attachments";
import { toast } from "sonner";
import { formatBytes } from "@labq-modules/ui/lib/utils";
import type { ContactAttachmentItem } from "@labq-modules/schemas";

interface ContactAttachmentsPanelProps {
  contactId: string;
}

const ACCEPT_MAP = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
  "image/gif": [".gif"],
  "application/pdf": [".pdf"],
  "text/plain": [".txt"],
  "text/csv": [".csv"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
};
async function handleDownload(attachment: ContactAttachmentItem) {
  try {
    await downloadAttachment(attachment.id, attachment.fileName);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Download failed");
  }
}

export function ContactAttachmentsPanel({ contactId }: ContactAttachmentsPanelProps) {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [uploading, setUploading] = useState(false);

  const { data, isLoading } = useQuery(
    orpc.crm.contacts.attachments.list.queryOptions({
      input: { contactId },
    }),
  );

  const attachments = (data as ContactAttachmentItem[] | undefined) ?? [];

  const handleUpload = async (files: File[]) => {
    setUploading(true);
    try {
      const results = await Promise.allSettled(
        files.map((file) => uploadContactAttachment(contactId, file)),
      );
      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0) {
        const first = failed[0]!;
        const reason = first.reason instanceof Error ? first.reason.message : "Upload failed";
        toast.error(`${failed.length}/${files.length} failed: ${reason}`);
      } else {
        toast.success(`${files.length} file(s) uploaded`);
      }
      void queryClient.invalidateQueries({
        queryKey: orpc.crm.contacts.attachments.list.queryKey({ input: { contactId } }),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    try {
      await (orpc.crm.contacts.attachments.delete as any).mutate({ id: attachmentId });
      void queryClient.invalidateQueries({
        queryKey: orpc.crm.contacts.attachments.list.queryKey({ input: { contactId } }),
      });
      toast.success("Attachment deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Attachments</h3>

      {hasPermission("crm.create") && (
        <FileUploader
          onUpload={handleUpload}
          accept={ACCEPT_MAP}
          maxSize={25 * 1024 * 1024}
          maxFiles={10}
          multiple
          disabled={uploading}
        />
      )}

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading attachments...</p>
      ) : attachments.length === 0 ? (
        <p className="text-muted-foreground text-sm">No attachments yet.</p>
      ) : (
        <div className="space-y-2">
          {attachments.map((att) => (
            <div key={att.id} className="flex items-center justify-between rounded-md border p-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{att.fileName}</p>
                <p className="text-muted-foreground text-xs">
                  {formatBytes(att.sizeBytes)} &middot; {att.uploadedByName ?? "\u2014"} &middot;{" "}
                  {new Date(att.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleDownload(att)}>
                  Download
                </Button>
                {hasPermission("crm.delete") && (
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(att.id)}>
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

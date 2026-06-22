import { describe, it, expect } from "vite-plus/test";
import { sanitizeAttachmentFileName, buildAttachmentStorageKey } from "./attachments";

describe("sanitizeAttachmentFileName", () => {
  it("strips path separators", () => {
    expect(sanitizeAttachmentFileName("path/to/file.txt")).toBe("path_to_file.txt");
    expect(sanitizeAttachmentFileName("C:\\Users\\file.txt")).toBe("C:_Users_file.txt");
  });

  it("collapses whitespace", () => {
    expect(sanitizeAttachmentFileName("my   file   name.txt")).toBe("my_file_name.txt");
    expect(sanitizeAttachmentFileName("  leading and trailing  .txt")).toBe(
      "leading_and_trailing_.txt",
    );
  });

  it("collapses consecutive underscores", () => {
    expect(sanitizeAttachmentFileName("file___name.txt")).toBe("file_name.txt");
  });

  it("preserves file extension", () => {
    expect(sanitizeAttachmentFileName("document.pdf")).toBe("document.pdf");
    expect(sanitizeAttachmentFileName("image.jpeg")).toBe("image.jpeg");
  });

  it("truncates to 255 characters", () => {
    const longName = "a".repeat(300) + ".txt";
    const result = sanitizeAttachmentFileName(longName);
    expect(result.length).toBeLessThanOrEqual(255);
  });

  it("handles files without extension", () => {
    expect(sanitizeAttachmentFileName("Makefile")).toBe("Makefile");
  });
});

describe("buildAttachmentStorageKey", () => {
  it("prefixes orgId/entityType/entityId", () => {
    const key = buildAttachmentStorageKey("org-1", "crm_contact", "contact-1", "file.txt");
    expect(key).toMatch(/^org-1\/crm_contact\/contact-1\//);
  });

  it("preserves original extension after UUID prefix", () => {
    const key = buildAttachmentStorageKey("org-1", "crm_contact", "contact-1", "report.pdf");
    const parts = key.split("/");
    const filename = parts[parts.length - 1];
    expect(filename).toMatch(/^[a-f0-9-]+-report\.pdf$/);
  });

  it("sanitizes the filename portion", () => {
    const key = buildAttachmentStorageKey("org-1", "crm_contact", "contact-1", "my file (1).txt");
    const parts = key.split("/");
    const filename = parts[parts.length - 1];
    expect(filename).toContain("my_file_(1).txt");
  });

  it("handles files without extension", () => {
    const key = buildAttachmentStorageKey("org-1", "crm_contact", "contact-1", "Makefile");
    const parts = key.split("/");
    const filename = parts[parts.length - 1];
    expect(filename).toMatch(/^[a-f0-9-]+-Makefile$/);
  });
});

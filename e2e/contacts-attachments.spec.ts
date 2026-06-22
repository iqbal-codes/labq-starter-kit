import { test, expect } from "@playwright/test";

test.describe("Contact Attachments", () => {
  test.beforeEach(async ({ page }) => {
    // Sign in with existing account
    await page.goto("/auth/sign-in");
    await page.getByLabel("Email").fill("e2e@gmail.com");
    await page.getByLabel("Password").fill("tester123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/(crm)?/);

    // Navigate to contacts
    await page.goto("/contacts");
    await expect(page.getByRole("heading", { name: "Contacts" })).toBeVisible();
  });

  test("upload, download, and delete an attachment", async ({ page }) => {
    // Create a contact
    await page.getByRole("button", { name: "Add Contact" }).click();
    await page.getByLabel("Name").fill("Attachment Test Contact");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Contact created")).toBeVisible();

    // Click the contact row to open detail sheet
    await page.getByText("Attachment Test Contact").click();
    await expect(page.getByText("Attachments")).toBeVisible();

    // Upload a small text file
    const fileInput = page.locator('input[type="file"]');

    // Create a test file via the file input
    await fileInput.setInputFiles({
      name: "test-upload.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Hello from E2E test"),
    });

    // Wait for upload to complete and file to appear in the list
    await expect(page.getByText("test-upload.txt")).toBeVisible({ timeout: 10000 });

    // Verify file details are shown
    await expect(page.getByText("test-upload.txt")).toBeVisible();
    await expect(page.getByText("Download")).toBeVisible();

    // Download the file and verify content
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download" }).first().click();
    const download = await downloadPromise;
    const downloadedContent = await download.path().then(async (filePath) => {
      if (!filePath) return "";
      const fs = await import("node:fs/promises");
      return fs.readFile(filePath, "utf-8");
    });
    expect(downloadedContent).toBe("Hello from E2E test");

    // Delete the attachment
    await page.getByRole("button", { name: "Delete" }).first().click();
    await expect(page.getByText("Attachment deleted")).toBeVisible();
    await expect(page.getByText("test-upload.txt")).not.toBeVisible();
  });

  test("rejects disallowed file type", async ({ page }) => {
    // Create a contact
    await page.getByRole("button", { name: "Add Contact" }).click();
    await page.getByLabel("Name").fill("Blocked File Contact");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Contact created")).toBeVisible();

    // Click the contact row
    await page.getByText("Blocked File Contact").click();
    await expect(page.getByText("Attachments")).toBeVisible();

    // Try to upload a disallowed file type (executable)
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: "malware.exe",
      mimeType: "application/octet-stream",
      buffer: Buffer.from("not really malware"),
    });

    // Expect error toast
    await expect(page.getByText("File type not allowed")).toBeVisible({ timeout: 10000 });

    // Attachment list should remain empty
    await expect(page.getByText("No attachments yet.")).toBeVisible();
  });
});

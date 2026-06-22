import { test, expect } from "@playwright/test";

test.describe("Contacts Import/Export", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/sign-in");
    await page.getByLabel("Email").fill("e2e@gmail.com");
    await page.getByLabel("Password").fill("tester123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/overview/);
    await page.goto("/contacts");
    await expect(page.getByRole("heading", { name: "Contacts" })).toBeVisible();
  });

  test("export CSV has correct headers", async ({ page }) => {
    // Create one contact manually so export has data
    await page.getByRole("button", { name: "Add Contact" }).click();
    await page.getByLabel("Name").fill("Export Test Contact");
    await page.getByLabel("Email").fill("export@test.com");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.locator("text=Export Test Contact")).toBeVisible();

    // Trigger export and capture download
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export CSV" }).click();
    const download = await downloadPromise;
    const content = await download.path().then(async (p) => {
      if (!p) return "";
      const fs = await import("node:fs");
      return fs.readFileSync(p, "utf-8");
    });

    const headers = content.split("\n")[0]?.trim();
    expect(headers).toBe("name,email,phone,status,source,notes");
  });

  test("import invalid CSV shows validation error and blocks import", async ({ page }) => {
    // Open import dialog
    await page.getByRole("button", { name: "Import CSV" }).click();
    await expect(page.getByText("Import contacts")).toBeVisible();

    // Upload a file with missing required 'name' column
    const csvContent = "email,status\nbad@test.com,lead";
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByText("Upload a file or drag and drop").click();
    const fileChooser = await fileChooserPromise;
    const tempFile = `/tmp/invalid-import.csv`;
    const fs = await import("node:fs");
    fs.writeFileSync(tempFile, csvContent);
    await fileChooser.setFiles(tempFile);

    // Assert validation error is shown
    await expect(page.getByText("Missing required columns: name")).toBeVisible();

    // Assert import button is not present (dialog shows errors only)
    await expect(page.getByRole("button", { name: /Import \d+ record/ })).not.toBeVisible();
  });

  test("import valid CSV adds contacts to table", async ({ page }) => {
    // Open import dialog
    await page.getByRole("button", { name: "Import CSV" }).click();
    await expect(page.getByText("Import contacts")).toBeVisible();

    // Upload a valid CSV file
    const csvContent =
      "name,email,phone,status,source,notes\nImported User,imported@test.com,555-0101,lead,web-import,Notes here";
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByText("Upload a file or drag and drop").click();
    const fileChooser = await fileChooserPromise;
    const tempFile = `/tmp/valid-import.csv`;
    const fs = await import("node:fs");
    fs.writeFileSync(tempFile, csvContent);
    await fileChooser.setFiles(tempFile);

    // Assert preview shows the row
    await expect(page.locator("td:has-text('Imported User')")).toBeVisible();

    // Click import button
    await page.getByRole("button", { name: /Import 1 record/ }).click();

    // Assert dialog closes and contact appears in table
    await expect(page.getByText("Import contacts")).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Imported User")).toBeVisible();
  });
});

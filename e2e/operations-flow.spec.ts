import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

async function signUpAndOnboard(page: Page) {
  await page.goto("/auth/sign-up");
  await page.getByLabel("Name").fill("Operations User");
  await page.getByLabel("Email").fill(`operations-${Date.now()}@example.com`);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL("/onboarding");
  await page.getByLabel("Organization name").fill(`Operations Org ${Date.now()}`);
  await page.getByRole("button", { name: "Create organization" }).click();
  await expect(page).toHaveURL("/overview", { timeout: 15000 });
}

test.describe("Operations sample module", () => {
  test("creates customer, service, and order then soft-deletes the order", async ({ page }) => {
    await signUpAndOnboard(page);

    await page.getByRole("link", { name: "Customers" }).click();
    await expect(page).toHaveURL(/\/customers$/);
    await page.getByRole("button", { name: "Add Customer" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByLabel("Name").fill("Acme Buyer");
    await page.getByLabel("Email").fill("buyer@example.com");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Acme Buyer", { exact: true })).toBeVisible();

    const customerRow = page.getByRole("row", { name: /Acme Buyer/ }).first();
    await customerRow.getByRole("button", { name: "Edit" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByLabel("Name").fill("Acme Buyer Updated");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Acme Buyer Updated", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Services" }).click();
    await expect(page).toHaveURL(/\/services$/);
    await page.getByRole("button", { name: "Add Service" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByLabel("Name").fill("Consultation");
    await page.getByLabel("Price (IDR)").fill("150000");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Consultation", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Orders" }).click();
    await expect(page).toHaveURL(/\/orders$/);
    await page.getByRole("button", { name: "Add Order" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByLabel("Title").fill("Website Setup");

    await page.getByLabel("Customer").click();
    await page.getByRole("option", { name: "Acme Buyer Updated" }).click();

    await page.getByLabel("Service").click();
    await page.getByRole("option", { name: "Consultation" }).click();

    await page.getByLabel("Status").click();
    await page.getByRole("option", { name: "Confirmed" }).click();

    await page.getByLabel("Total amount (IDR)").fill("150000");
    await page.getByLabel("Due date").fill("2026-12-31");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });

    const orderRow = page.getByRole("row", { name: /Website Setup/ }).first();
    await expect(orderRow).toContainText("Acme Buyer Updated");
    await expect(orderRow).toContainText("Consultation");

    page.once("dialog", (dialog) => dialog.accept());
    await orderRow.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("Website Setup", { exact: true })).not.toBeVisible();
  });
});

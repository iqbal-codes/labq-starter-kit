import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

async function signUpAndOnboard(page: Page) {
  await page.goto("/auth/sign-up");
  await page.getByLabel("Name").fill("Data Table User");
  await page
    .getByLabel("Email")
    .fill(`datatable-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL("/onboarding");
  await page.getByLabel("Organization name").fill(`Data Table Org ${Date.now()}`);
  await page.getByRole("button", { name: "Create organization" }).click();
  await expect(page).toHaveURL("/overview", { timeout: 15000 });
}

test.describe("Data Table URL State", () => {
  test.beforeEach(async ({ page }) => {
    await signUpAndOnboard(page);
    await page.getByRole("link", { name: "Customers" }).click();
    await expect(page).toHaveURL(/\/customers$/);
    await expect(page.getByRole("heading", { name: "Customers" })).toBeVisible();
  });

  test("customers table syncs URL state for filter, sort, and page size", async ({ page }) => {
    await page.getByRole("button", { name: "Add Customer" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByLabel("Name").fill("Bravo Customer");
    await page.getByLabel("Email").fill("bravo@example.com");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Bravo Customer")).toBeVisible();

    await page.getByRole("button", { name: "Add Customer" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByLabel("Name").fill("Alpha Customer");
    await page.getByLabel("Email").fill("alpha@example.com");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Alpha Customer")).toBeVisible();

    const filterInput = page.getByPlaceholder("Search customers...");
    await filterInput.fill("Alpha");
    await expect(filterInput).toHaveValue("Alpha");

    await expect
      .poll(() => new URL(page.url()).searchParams.get("search"), { timeout: 5000 })
      .toBe("Alpha");

    await expect(page.locator("text=Alpha Customer")).toBeVisible();
    await expect(page.locator("text=Bravo Customer")).not.toBeVisible();

    const nameHeader = page.getByRole("columnheader", { name: /Name/ });
    await nameHeader.getByRole("button").click();
    await page.getByRole("menuitemcheckbox", { name: /Asc/ }).click();
    await page.keyboard.press("Escape");

    await expect
      .poll(() => new URL(page.url()).searchParams.get("sort"), { timeout: 5000 })
      .not.toBeNull();

    const pageSizeSelect = page.getByRole("combobox").last();
    await pageSizeSelect.click();
    await page.getByRole("option", { name: "20" }).click();

    await expect
      .poll(() => new URL(page.url()).searchParams.get("perPage"), { timeout: 5000 })
      .toBe("20");
  });
});

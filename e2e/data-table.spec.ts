import { test, expect } from "@playwright/test";

test.describe("Data Table URL State", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/sign-in");
    await page.getByLabel("Email").fill("e2e@gmail.com");
    await page.getByLabel("Password").fill("tester123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL("/overview");
    await page.getByRole("link", { name: "Contacts" }).click();
    await expect(page).toHaveURL(/\/contacts$/);
    await expect(page.getByRole("heading", { name: "Contacts" })).toBeVisible();
  });

  test("CRM contacts table syncs URL state for filter, sort, and page size", async ({ page }) => {
    // Create Bravo Contact
    await page.getByRole("button", { name: "Add Contact" }).click();
    await page.getByLabel("Name").fill("Bravo Contact");
    await page.getByLabel("Email").fill("bravo@example.com");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.locator("text=Bravo Contact")).toBeVisible();

    // Create Alpha Contact
    await page.getByRole("button", { name: "Add Contact" }).click();
    await page.getByLabel("Name").fill("Alpha Contact");
    await page.getByLabel("Email").fill("alpha@example.com");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.locator("text=Alpha Contact")).toBeVisible();

    // Use the toolbar text filter to enter "Alpha"
    const filterInput = page.getByPlaceholder("Search contacts...");
    await filterInput.fill("Alpha");
    await expect(filterInput).toHaveValue("Alpha");

    // Assert the URL contains search=Alpha
    await expect
      .poll(() => new URL(page.url()).searchParams.get("search"), { timeout: 5000 })
      .toBe("Alpha");

    // Assert the server-backed list is filtered by the generic search param
    await expect(page.locator("text=Alpha Contact")).toBeVisible();
    await expect(page.locator("text=Bravo Contact")).not.toBeVisible();

    // Open the Name header dropdown, click Asc
    const nameHeader = page.getByRole("columnheader", { name: /Name/ });
    await nameHeader.getByRole("button").click();
    await page.getByRole("menuitemcheckbox", { name: /Asc/ }).click();
    await page.keyboard.press("Escape");

    // Assert the URL contains a sort= query param
    await expect
      .poll(() => new URL(page.url()).searchParams.get("sort"), { timeout: 5000 })
      .not.toBeNull();

    // Change rows per page to 20
    const pageSizeSelect = page.getByRole("combobox").last();
    await pageSizeSelect.click();
    await page.getByRole("option", { name: "20" }).click();

    // Assert the URL contains perPage=20
    await expect
      .poll(() => new URL(page.url()).searchParams.get("perPage"), { timeout: 5000 })
      .toBe("20");
  });
});

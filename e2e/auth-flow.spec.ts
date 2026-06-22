import { test, expect, type Page } from "@playwright/test";

async function signIn(page: Page) {
  await page.goto("/auth/sign-in");
  await page.getByLabel("Email").fill("e2e@gmail.com");
  await page.getByLabel("Password").fill("tester123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/overview");
}

test.describe("Authentication Flow", () => {
  test("sign up requires organization onboarding before entering the app", async ({ page }) => {
    await page.goto("/auth/sign-up");

    await page.getByLabel("Name").fill("Test User");
    await page.getByLabel("Email").fill(`test-${Date.now()}@example.com`);
    await page.getByLabel("Password").fill("password123");

    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL("/onboarding");
    await expect(page.getByLabel("Organization name")).toBeVisible();

    const orgName = `Acme Labs ${Date.now()}`;
    await page.getByLabel("Organization name").fill(orgName);
    await page.getByRole("button", { name: "Create organization" }).click();

    await expect(page).toHaveURL("/overview", { timeout: 15000 });
    await expect(page.getByTestId("sidebar-org-selector")).toContainText(orgName);
    await expect(page.getByRole("link", { name: "Contacts" })).toBeVisible();
  });

  test("sign in with existing account redirects to the app", async ({ page }) => {
    await signIn(page);

    await page.getByRole("button", { name: /e2e@gmail.com/ }).click();
    await page.getByRole("menuitem", { name: "Sign Out" }).click();
    await expect(page).toHaveURL(/\/auth\/sign-in/);

    await page.getByLabel("Email").fill("e2e@gmail.com");
    await page.getByLabel("Password").fill("tester123");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL("/overview");
  });

  test("unauthenticated access redirects to sign in", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/auth/sign-in");
  });
});

test.describe("Shell Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test("companies page renders content", async ({ page }) => {
    await page.getByRole("link", { name: "Companies" }).click();
    await expect(page).toHaveURL(/\/companies$/);
    await expect(page.getByRole("button", { name: "Add Company" })).toBeVisible();
  });

  test("sidebar org selector shows active organization", async ({ page }) => {
    const orgSelector = page.getByTestId("sidebar-org-selector");
    await expect(orgSelector).toBeVisible({ timeout: 15000 });

    // Original org should be shown
    const originalOrgName = (await orgSelector.innerText()).trim();
    expect(originalOrgName.length).toBeGreaterThan(0);

    // Create a second organization via onboarding
    await page.goto("/onboarding");
    await expect(page.getByLabel("Organization name")).toBeVisible();
    const newOrgName = `Switch Test ${Date.now()}`;
    await page.getByLabel("Organization name").fill(newOrgName);
    await page.getByRole("button", { name: "Create organization" }).click();
    await expect(page).toHaveURL("/overview", { timeout: 15000 });

    // New org should be shown in the selector
    await expect(orgSelector).toContainText(newOrgName);
    await expect(page.getByRole("link", { name: "Contacts" })).toBeVisible();
  });
});

test.describe("CRM Contacts", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.getByRole("link", { name: "Contacts" }).click();
    await expect(page).toHaveURL(/\/contacts$/);
    await expect(page.getByRole("heading", { name: "Contacts" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Contact" })).toBeVisible();
  });

  test("create, edit, and soft-delete a contact", async ({ page }) => {
    // Create
    await page.getByRole("button", { name: "Add Contact" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByLabel("Name").click();
    await page.getByLabel("Name").fill("John Doe");
    await page.getByLabel("Email").click();
    await page.getByLabel("Email").fill("john@example.com");
    await page.keyboard.press("Enter");
    // Wait for dialog to close
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    // After creation, UI may navigate to detail page — go back to list via sidebar
    await page.locator('[data-sidebar="menu-button"]').filter({ hasText: "Contacts" }).click();
    await expect(page.getByRole("heading", { name: "Contacts" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "John Doe" }).first()).toBeVisible();

    // Edit
    await page.getByRole("button", { name: "Edit" }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByLabel("Name").click();
    await page.getByLabel("Name").fill("John Updated");
    await page.keyboard.press("Enter");
    // Wait for dialog to close
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("cell", { name: "John Updated" }).first()).toBeVisible();

    // Soft delete
    await page.getByRole("button", { name: "Delete" }).first().click();
    await expect(page.getByRole("cell", { name: "John Updated" })).not.toBeVisible();
  });
});

test.describe("CRM Companies", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.getByRole("link", { name: "Companies" }).click();
    await expect(page).toHaveURL(/\/companies$/);
    await expect(page.getByRole("heading", { name: "Companies" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Company" })).toBeVisible();
  });

  test("create and edit a company", async ({ page }) => {
    // Create
    await page.getByRole("button", { name: "Add Company" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByLabel("Name").click();
    await page.getByLabel("Name").fill("Acme Corp");
    await page.keyboard.press("Enter");
    // Wait for dialog to close
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    // Navigate back to companies list (UI may show detail page)
    await page.getByRole("link", { name: "Companies" }).click();
    await expect(page.getByRole("heading", { name: "Companies" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Acme Corp" }).first()).toBeVisible();

    // Edit
    await page.getByRole("button", { name: "Edit" }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByLabel("Name").click();
    await page.getByLabel("Name").fill("Acme Industries");
    await page.keyboard.press("Enter");
    // Wait for dialog to close
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("cell", { name: "Acme Industries" }).first()).toBeVisible();
  });

  test("validation blocks submit with empty name", async ({ page }) => {
    await page.getByRole("button", { name: "Add Company" }).click();
    // Name field is empty — submit should be blocked by schema validation
    await page.getByRole("button", { name: "Save" }).click();
    // Dialog should still be open
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});

test.describe("CRM Deals", () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
    await page.getByRole("link", { name: "Deals" }).click();
    await expect(page).toHaveURL(/\/deals$/);
    await expect(page.getByRole("heading", { name: "Deals" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Deal" })).toBeVisible();
  });

  test("create and edit a deal with value and close date", async ({ page }) => {
    // Create
    await page.getByRole("button", { name: "Add Deal" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByLabel("Title").click();
    await page.getByLabel("Title").fill("Big Deal");
    await page.getByLabel("Value (IDR)").click();
    await page.getByLabel("Value (IDR)").fill("5000000");
    // Date picker is a custom component — click and type date
    await page.getByPlaceholder("Pick a date").click();
    await page.getByPlaceholder("Pick a date").fill("2026-12-31");
    await page.keyboard.press("Escape");
    await page.keyboard.press("Enter");
    // Wait for dialog to close
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("cell", { name: "Big Deal" }).first()).toBeVisible();
    await expect(page.getByRole("cell", { name: /5,000,000/ }).first()).toBeVisible();

    // Edit
    await page.getByRole("button", { name: "Edit" }).first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByLabel("Title").click();
    await page.getByLabel("Title").fill("Big Deal Updated");
    await page.keyboard.press("Enter");
    // Wait for dialog to close
    await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("cell", { name: "Big Deal Updated" }).first()).toBeVisible();
  });
});

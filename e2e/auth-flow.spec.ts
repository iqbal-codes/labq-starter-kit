import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

async function signUpAndOnboard(page: Page) {
  const email = `test-${Date.now()}@example.com`;
  const password = "password123";
  const orgName = `Acme Labs ${Date.now()}`;

  await page.goto("/auth/sign-up");
  await page.getByLabel("Name").fill("Test User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL("/onboarding");
  await expect(page.getByLabel("Organization name")).toBeVisible();
  await page.getByLabel("Organization name").fill(orgName);
  await page.getByRole("button", { name: "Create organization" }).click();
  await expect(page).toHaveURL("/overview", { timeout: 15000 });

  return { email, password, orgName };
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/auth/sign-in");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/overview");
}

test.describe("Authentication Flow", () => {
  test("sign up requires organization onboarding before entering the app", async ({ page }) => {
    const { orgName } = await signUpAndOnboard(page);

    await expect(page.getByTestId("sidebar-org-selector")).toContainText(orgName);
    await expect(page.getByRole("link", { name: "Orders" })).toBeVisible();
  });

  test("sign in with existing account redirects to the app", async ({ page }) => {
    const { email, password } = await signUpAndOnboard(page);

    await page.getByRole("button", { name: /@example.com/ }).click();
    await page.getByRole("menuitem", { name: "Sign Out" }).click();
    await expect(page).toHaveURL(/\/auth\/sign-in/);

    await signIn(page, email, password);
  });

  test("unauthenticated access redirects to sign in", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL("/auth/sign-in");
  });
});

test.describe("Shell Navigation", () => {
  test("orders page renders content", async ({ page }) => {
    await signUpAndOnboard(page);
    await page.getByRole("link", { name: "Orders" }).click();
    await expect(page).toHaveURL(/\/orders$/);
    await expect(page.getByRole("button", { name: "Add Order" })).toBeVisible();
  });

  test("sidebar org selector shows active organization", async ({ page }) => {
    await signUpAndOnboard(page);

    const orgSelector = page.getByTestId("sidebar-org-selector");
    await expect(orgSelector).toBeVisible({ timeout: 15000 });

    const originalOrgName = (await orgSelector.innerText()).trim();
    expect(originalOrgName.length).toBeGreaterThan(0);

    await page.goto("/onboarding");
    await expect(page.getByLabel("Organization name")).toBeVisible();
    const newOrgName = `Switch Test ${Date.now()}`;
    await page.getByLabel("Organization name").fill(newOrgName);
    await page.getByRole("button", { name: "Create organization" }).click();
    await expect(page).toHaveURL("/overview", { timeout: 15000 });

    await expect(orgSelector).toContainText(newOrgName);
    await expect(page.getByRole("link", { name: "Orders" })).toBeVisible();
  });
});

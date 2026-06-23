import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

async function signUpAndOnboard(page: Page) {
  const email = `theme-${Date.now()}@example.com`;
  const password = "password123";
  const orgName = `Theme Labs ${Date.now()}`;

  await page.goto("/auth/sign-up");
  await page.getByLabel("Name").fill("Theme User");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL("/onboarding");
  await page.getByLabel("Organization name").fill(orgName);
  await page.getByRole("button", { name: "Create organization" }).click();
  await expect(page).toHaveURL("/overview", { timeout: 15000 });
}

test.describe("Theme toggle", () => {
  test("persists the selected theme after reload", async ({ page }) => {
    await signUpAndOnboard(page);

    const html = page.locator("html");
    const toggle = page.getByRole("button", { name: "Toggle theme" });

    await expect(html).not.toHaveClass(/dark/);
    await toggle.click();
    await expect(html).toHaveClass(/dark/);
    await expect.poll(() => page.evaluate(() => localStorage.getItem("theme"))).toBe("dark");

    await page.reload();
    await expect(page).toHaveURL(/\/overview$/);
    await expect(html).toHaveClass(/dark/);
  });

  test.describe("system theme default", () => {
    test.use({ colorScheme: "dark" });

    test("follows the browser preference when no saved theme exists", async ({ page }) => {
      await signUpAndOnboard(page);

      const html = page.locator("html");

      await expect.poll(() => page.evaluate(() => localStorage.getItem("theme"))).toBe(null);
      await expect(html).toHaveClass(/dark/);
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              document.documentElement.style.colorScheme ||
              getComputedStyle(document.documentElement).colorScheme,
          ),
        )
        .toContain("dark");
    });
  });
});

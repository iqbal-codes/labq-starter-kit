import { test, expect } from "@playwright/test";

test.describe("Storefront Theme toggle", () => {
  test.use({ baseURL: "http://localhost:3200" });

  test("persists the selected theme after reload", async ({ page }) => {
    page.on("console", (msg) => {
      console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
    });
    page.on("pageerror", (err) => {
      console.log(`[BROWSER EXCEPTION] ${err.message}`);
    });

    await page.goto("/");

    const html = page.locator("html");
    const toggle = page.getByRole("button", { name: "Toggle theme" });

    // 1. Initially should match the default/system color scheme (light for this test)
    await expect(html).not.toHaveClass(/dark/);

    // 2. Toggle the theme to dark
    await toggle.click();
    await expect(html).toHaveClass(/dark/);
    await expect.poll(() => page.evaluate(() => localStorage.getItem("theme"))).toBe("dark");

    // 3. Reload page and check persistence
    await page.reload();
    await expect(html).toHaveClass(/dark/);

    // 4. Toggle back to light
    await toggle.click();
    await expect(html).not.toHaveClass(/dark/);
    await expect.poll(() => page.evaluate(() => localStorage.getItem("theme"))).toBe("light");

    // 5. Reload page and check persistence
    await page.reload();
    await expect(html).not.toHaveClass(/dark/);
  });

  test.describe("system theme default", () => {
    test.use({ baseURL: "http://localhost:3200", colorScheme: "dark" });

    test("follows the browser preference when no saved theme exists", async ({ page }) => {
      await page.goto("/");

      const html = page.locator("html");

      // Verify no stored override is present
      await expect.poll(() => page.evaluate(() => localStorage.getItem("theme"))).toBe(null);

      // Verify page is dark because system preference is dark
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

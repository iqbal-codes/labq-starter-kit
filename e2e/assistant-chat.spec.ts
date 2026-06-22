import { test, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

async function signUpAndReachOperations(page: Page) {
  await page.goto("/auth/sign-up");
  await page.getByLabel("Name").fill("Assistant User");
  await page.getByLabel("Email").fill(`assistant-${Date.now()}@example.com`);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL("/onboarding");
  await page.getByLabel("Organization name").fill(`Assistant Org ${Date.now()}`);
  await page.getByRole("button", { name: "Create organization" }).click();
  await expect(page).toHaveURL("/overview", { timeout: 15000 });
  // Sidebar link may not be visible at mobile viewport widths
}

async function ensureOperationsRoute(page: Page) {
  await expect(page).toHaveURL("/overview");
  await expect(page.getByRole("link", { name: "Orders" })).toBeVisible();
}

async function openAssistant(page: Page) {
  const trigger = page.getByRole("button", { name: "Open Assistant" });
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(page.getByText("Admin Template Assistant", { exact: true })).toBeVisible();
  return trigger;
}

async function seedAssistantHistory(page: Page, exchanges: number) {
  for (let index = 0; index < exchanges; index += 1) {
    const response = await page.request.post("http://localhost:4000/api/ai/chat", {
      data: {
        messages: [
          {
            id: `seed-${index}`,
            role: "user",
            content: `Seed message ${index}: reply only ack-${index}.`,
          },
        ],
      },
    });
    expect(response.ok()).toBeTruthy();
    await response.body();
  }
}

type TranscriptMetrics = {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  distanceFromBottom: number;
};

type ScrollableTranscript = {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  dispatchEvent: (event: Event) => boolean;
};

async function getTranscriptMetrics(page: Page) {
  return page.getByTestId("assistant-transcript").evaluate((element) => {
    const transcript = element as unknown as ScrollableTranscript;
    const distanceFromBottom =
      transcript.scrollHeight - transcript.scrollTop - transcript.clientHeight;
    return {
      scrollTop: transcript.scrollTop,
      scrollHeight: transcript.scrollHeight,
      clientHeight: transcript.clientHeight,
      distanceFromBottom,
    } satisfies TranscriptMetrics;
  });
}

test.describe("AI Assistant Chat", () => {
  test("restores assistant transcript after refresh", async ({ page }) => {
    await signUpAndReachOperations(page);

    const floatButton = await openAssistant(page);
    await expect(page.getByPlaceholder("Type a message...")).toBeVisible();

    const prompt = "What modules are enabled?";
    await page.getByPlaceholder("Type a message...").fill(prompt);
    await page.keyboard.press("Enter");

    const assistantBubble = page.locator("span:has-text('Assistant') + div").last();
    await expect(assistantBubble).toContainText(/[a-zA-Z]/, { timeout: 25000 });
    const assistantText = (await assistantBubble.innerText()).replace(/\s+/g, " ").trim();
    const assistantSnippet = assistantText.slice(0, 48);

    await page.reload();
    await ensureOperationsRoute(page);
    await expect(floatButton).toBeVisible();
    await floatButton.click();

    await expect(page.getByText(prompt, { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(assistantSnippet, { exact: false })).toBeVisible({
      timeout: 15000,
    });
  });

  test("loads earlier history and restores bottom scroll affordance", async ({ page }) => {
    test.setTimeout(120_000);

    await signUpAndReachOperations(page);
    await seedAssistantHistory(page, 18);
    await openAssistant(page);

    const transcript = page.getByTestId("assistant-transcript");
    const loadEarlierButton = page.getByRole("button", { name: /Load earlier/ });
    const scrollToBottomButton = page.getByRole("button", { name: "Scroll to bottom" });

    await expect(transcript).toBeVisible();
    await expect(loadEarlierButton).toBeVisible({ timeout: 15000 });
    await expect(
      page.getByText("Seed message 17: reply only ack-17.", { exact: true }),
    ).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByText("Seed message 0: reply only ack-0.", { exact: true })).toHaveCount(
      0,
    );

    const beforeLoad = await getTranscriptMetrics(page);
    await loadEarlierButton.click();
    await expect(page.getByText("Seed message 0: reply only ack-0.", { exact: true })).toBeVisible({
      timeout: 15000,
    });

    const afterLoad = await getTranscriptMetrics(page);
    expect(Math.abs(afterLoad.distanceFromBottom - beforeLoad.distanceFromBottom)).toBeLessThan(48);

    await transcript.evaluate((element) => {
      const node = element as unknown as ScrollableTranscript;
      node.scrollTop = 0;
      node.dispatchEvent(new Event("scroll"));
    });

    await expect(scrollToBottomButton).toBeVisible();
    await scrollToBottomButton.click();

    await expect
      .poll(async () => {
        const { distanceFromBottom } = await getTranscriptMetrics(page);
        return distanceFromBottom;
      })
      .toBeLessThan(24);
    await expect(scrollToBottomButton).toBeHidden();
  });
});

import { test, expect, type Page } from "@playwright/test";

async function signInAndReachCrm(page: Page) {
  await page.goto("/auth/sign-in");
  await page.getByLabel("Email").fill("e2e@gmail.com");
  await page.getByLabel("Password").fill("tester123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL("/overview");
  await expect(page.getByRole("link", { name: "Contacts" })).toBeVisible();
}

async function openAssistant(page: Page) {
  const trigger = page.getByRole("button", { name: "Open Assistant" });
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(page.getByText("LabQ Assistant", { exact: true })).toBeVisible();
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
    await signInAndReachCrm(page);

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
    await ensureCrmRoute(page);
    await expect(floatButton).toBeVisible();
    await floatButton.click();

    await expect(page.getByText(prompt, { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(assistantSnippet, { exact: false })).toBeVisible({
      timeout: 15000,
    });
  });

  test("loads earlier history and restores bottom scroll affordance", async ({ page }) => {
    test.setTimeout(120_000);

    await signInAndReachCrm(page);
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

  test.describe("mobile sheet", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("keeps the mobile assistant header visible and transcript scrollable", async ({
      page,
    }) => {
      await signInAndReachCrm(page);
      await seedAssistantHistory(page, 18);
      await openAssistant(page);

      const sheet = page.locator('[data-slot="sheet-content"]');
      const transcript = page.getByTestId("assistant-transcript");
      const scrollToBottomButton = page.getByRole("button", { name: "Scroll to bottom" });
      await expect(sheet).toBeVisible();
      await expect(sheet).toHaveAttribute("data-side", "bottom");
      await expect(page.getByText("LabQ Assistant", { exact: true })).toBeVisible();
      await expect(transcript).toBeVisible();

      const viewport = page.viewportSize();
      const box = await sheet.boundingBox();

      expect(viewport).not.toBeNull();
      expect(box).not.toBeNull();
      expect(box?.x ?? 0).toBeLessThanOrEqual(1);
      expect(Math.abs((box?.width ?? 0) - (viewport?.width ?? 0))).toBeLessThanOrEqual(1);

      await expect
        .poll(async () => {
          const metrics = await getTranscriptMetrics(page);
          return metrics.scrollHeight > metrics.clientHeight;
        })
        .toBeTruthy();

      await transcript.evaluate((element) => {
        const node = element as unknown as ScrollableTranscript;
        node.scrollTop = 0;
        node.dispatchEvent(new Event("scroll"));
      });

      await expect(scrollToBottomButton).toBeVisible();
      await expect(page.getByText("LabQ Assistant", { exact: true })).toBeVisible();
    });
  });
});

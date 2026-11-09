import { test, expect } from "../fixtures.js";

test("practices a deck with the keyboard, then only the missed cards", async ({ page, user }) => {
  const position = page.locator(".deck-position");
  // The card itself: "<word>. Press space to reveal" until it's flipped.
  const card = page.getByRole("button", { name: /Press space to reveal|^Answer:/ });

  await page.goto("/flashcards");
  await page.getByRole("link", { name: /Greetings/ }).click();
  await expect(position).toHaveText(/^1 \/ \d+$/);
  const total = Number((await position.innerText()).split("/")[1]);

  const missed = [];
  await test.step("Space flips each card, ← marks it missed, → known", async () => {
    for (let i = 1; i <= total; i++) {
      await expect(position).toHaveText(`${i} / ${total}`);
      const word = (await card.getAttribute("aria-label")).replace(/\. Press space to reveal$/, "");

      await page.keyboard.press("Space");
      await expect(card).toHaveAttribute("aria-label", /^Answer: /);

      if (i <= 2) {
        missed.push(word);
        await page.keyboard.press("ArrowLeft");
      } else {
        await page.keyboard.press("ArrowRight");
      }
    }
  });

  await test.step("the results list the missed words and the XP earned", async () => {
    await expect(page.getByRole("heading", { name: "Session complete!" })).toBeVisible();
    await expect(page.getByText(`${total - 2} / ${total}`)).toBeVisible();
    for (const word of missed) {
      await expect(page.locator(".missed").getByText(word, { exact: true })).toBeVisible();
    }
    await expect(page.getByText(`+${total - 2} XP`)).toBeVisible();
  });

  await test.step('"Practice missed" replays only those two cards', async () => {
    await page.getByRole("button", { name: "Practice missed (2)" }).click();
    for (let i = 1; i <= 2; i++) {
      await expect(position).toHaveText(`${i} / 2`);
      const word = (await card.getAttribute("aria-label")).replace(/\. Press space to reveal$/, "");
      expect(missed).toContain(word);
      await page.keyboard.press("Space");
      await expect(card).toHaveAttribute("aria-label", /^Answer: /);
      await page.keyboard.press("ArrowRight");
    }
    await expect(page.getByText("2 / 2")).toBeVisible();
    // The XP appears once the server has saved the session. Without this
    // wait, the dashboard below can load before the save lands.
    await expect(page.getByText("+2 XP")).toBeVisible();
    await expect(page.getByRole("button", { name: /Practice missed/ })).toHaveCount(0);
  });

  await test.step("both sessions are saved on the dashboard", async () => {
    await page.getByRole("link", { name: "Dashboard" }).click();
    await expect(page.locator(".activity-list li", { hasText: "Greetings" })).toHaveCount(2);
    await expect(page.locator(".stat-card", { hasText: "Flashcards reviewed" })).toContainText(
      String(total + 2),
    );
  });
});

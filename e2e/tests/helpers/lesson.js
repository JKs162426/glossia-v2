import { expect } from "@playwright/test";

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Plays the lesson open in `page`, answering every exercise right the way a
// learner would: reading the prompt, then clicking or typing. The answers
// come from the lesson's own words (GET /api/learn/lessons/:id).
export async function playLesson(page, lessonId, language = "es") {
  const res = await page.request.get(`/api/learn/lessons/${lessonId}?language=${language}`);
  expect(res.ok()).toBe(true);
  const { cards } = await res.json();
  const meaningOf = new Map(cards.map((c) => [c.term, c.meaning]));
  const termFor = new Map(cards.map((c) => [c.meaning, c.term]));

  const prompt = page.locator(".lesson-prompt");
  const results = page.getByRole("heading", { name: /complete!|passed!/ });

  for (;;) {
    // The next exercise, or the results once the last one is saved.
    await expect(prompt.or(results)).toBeVisible();
    if (await results.isVisible()) return;

    const question = await prompt.innerText();
    if (question === "Match the pairs") {
      const left = page.locator(".match-col").first().getByRole("button");
      const right = page.locator(".match-col").nth(1);
      for (const term of (await left.allInnerTexts()).map((t) => t.trim())) {
        await left.filter({ hasText: new RegExp(`^${escape(term)}$`) }).click();
        await right.getByRole("button", { name: new RegExp(`^${escape(meaningOf.get(term))}$`) }).click();
      }
    } else {
      const shown = (await page.locator(".prompt-text").innerText()).replace(/[“”]/g, "");
      if (question.startsWith("Write this")) {
        await page.getByRole("textbox").fill(termFor.get(shown));
      } else {
        const answer = question === "What does this mean?" ? meaningOf.get(shown) : termFor.get(shown);
        // Options read "1 hola": the key number, then the word.
        await page
          .locator(".options")
          .getByRole("button", { name: new RegExp(`^\\d ${escape(answer)}$`) })
          .click();
      }
      await page.getByRole("button", { name: "Check", exact: true }).click();
    }

    await expect(page.getByText("Correct!", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();
  }
}

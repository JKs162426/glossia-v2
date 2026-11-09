import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "../fixtures.js";

// WCAG 2.2 levels A and AA: the usual legal and industry baseline.
const WCAG_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

// Runs axe on the page as it is now. One line per problem, so a failure
// says what's wrong and on which element. `except` lists reviewed false
// positives as [rule id, element]; every other rule still checks that element.
async function expectNoViolations(page, { except = [] } = {}) {
  // Check the page at rest. A button that was just enabled fades in from
  // the dimmed disabled look, and measured mid-fade its text fails the
  // contrast check. (They all end: animations play once with reduced motion.)
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));

  const { violations } = await new AxeBuilder({ page })
    // By default axe downloads every stylesheet with fetch(). The site's CSP
    // blocks that for Google Fonts (as it should), and the console error
    // would fail the test. Only one rule needs it: screen orientation lock.
    // (Before withTags: options() replaces everything set so far.)
    .options({ preload: false })
    .withTags(WCAG_AA)
    .analyze();
  const problems = violations.flatMap((v) =>
    v.nodes
      .filter((node) => !except.some(([rule, target]) => rule === v.id && node.target.join(" ") === target))
      .map((node) => `${v.id} (${v.impact}): ${v.help} — ${node.target.join(" ")}`),
  );
  expect(problems, "accessibility problems").toEqual([]);
}

test.describe("logged out", () => {
  test("login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("button", { name: "Log in" })).toBeVisible();
    await expectNoViolations(page);
  });

  test("register page", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("button", { name: "Create account" })).toBeVisible();
    await expectNoViolations(page);
  });
});

test.describe("logged in", () => {
  test("dashboard", async ({ page, user }) => {
    await page.goto("/");
    await expect(page.locator(".stat-card")).toHaveCount(4);
    await expectNoViolations(page);
  });

  test("learning path", async ({ page, user }) => {
    await page.goto("/learn");
    await expect(page.getByRole("link", { name: "Hello! — start" })).toBeVisible();
    await expectNoViolations(page);
  });

  test("lesson", async ({ page, user }) => {
    await page.goto("/learn/a1-u1-l1");
    await expect(page.getByRole("button", { name: "Check" })).toBeVisible();
    await expectNoViolations(page);
  });

  test("flashcard decks and a deck", async ({ page, user }) => {
    await page.goto("/flashcards");
    await expect(page.getByRole("link", { name: /Greetings/ })).toBeVisible();
    await expectNoViolations(page);

    await page.getByRole("link", { name: /Greetings/ }).click();
    await expect(page.locator(".deck-position")).toHaveText(/^1 \//);
    // The card's name is the word plus the instruction ("Por favor. Press
    // space to reveal"), never the answer. axe counts the answer on the back
    // face as visible text, though it's turned away until the card flips.
    await expectNoViolations(page, { except: [["label-content-name-mismatch", ".flashcard"]] });
  });

  test("translator, with a translation and then saved", async ({ page, user }) => {
    await page.route("https://api.mymemory.translated.net/**", (route) =>
      route.fulfill({
        headers: { "Access-Control-Allow-Origin": "*" },
        json: { responseStatus: 200, responseData: { translatedText: "buenos días" } },
      }),
    );
    await page.goto("/translator");
    await page.getByLabel("Text to translate").fill("good morning");
    await page.getByRole("button", { name: /^Translate/ }).click();
    await expect(page.locator(".result-text")).toHaveText("buenos días");
    await expectNoViolations(page);

    await page.getByRole("button", { name: "Save to favorites" }).click();
    await expect(page.getByRole("link", { name: "View favorites" })).toBeVisible();
    await expectNoViolations(page);
  });

  test("favorites, with a saved word", async ({ page, user }) => {
    const saved = await page.request.post("/api/favorites", {
      data: { word: "buenos días", translation: "good morning", language: "es" },
    });
    expect(saved.status()).toBe(201);
    await page.goto("/favorites");
    await expect(page.getByRole("heading", { name: "buenos días" })).toBeVisible();
    await expectNoViolations(page);
  });
});

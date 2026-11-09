import { test, expect } from "../fixtures.js";

// An iPhone 13–15 sized screen, with touch.
test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

// Apple's and Google's guidelines: touch targets of at least 44 px.
const MIN_TAP_SIZE = 44;

// Elements that stick out past the left or right edge. On a phone they're
// either cut off or make the whole page scroll sideways.
const elementsOffScreen = (page) =>
  page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    return [...document.querySelectorAll("body *")]
      .filter((el) => {
        const box = el.getBoundingClientRect();
        return box.width > 0 && (box.left < -1 || box.right > width + 1);
      })
      .map((el) => el.outerHTML.slice(0, 100));
  });

// What every page in the app shell needs on a phone: no sideways scrolling,
// the top bar and bottom nav in place, and nothing hidden behind them.
async function expectPhoneLayout(page) {
  expect(await elementsOffScreen(page), "elements past the screen edges").toEqual([]);

  const topBar = page.locator(".mobile-topbar");
  await expect(topBar.getByRole("button", { name: "Log out" })).toBeVisible();

  const nav = page.getByRole("navigation", { name: "Main" });
  const links = nav.getByRole("link");
  await expect(links).toHaveText(["Dashboard", "Learn", "Flashcards", "Translator", "Favorites"]);
  const navBox = await nav.boundingBox();
  expect(navBox.y + navBox.height, "the nav sits at the bottom of the screen").toBe(844);
  for (const link of await links.all()) {
    const box = await link.boundingBox();
    expect(box.height, "nav link height").toBeGreaterThanOrEqual(MIN_TAP_SIZE);
    expect(box.width, "nav link width").toBeGreaterThanOrEqual(MIN_TAP_SIZE);
  }

  // The title starts below the fixed top bar…
  const topBarBox = await topBar.boundingBox();
  const titleBox = await page.getByRole("heading", { level: 1 }).boundingBox();
  expect(titleBox.y).toBeGreaterThanOrEqual(topBarBox.y + topBarBox.height);

  // …and the end of the page can be scrolled above the fixed nav.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  const lastBox = await page.locator(".main-content > .page > :last-child").boundingBox();
  const navTop = (await nav.boundingBox()).y;
  expect(lastBox.y + lastBox.height, "the last section clears the bottom nav").toBeLessThanOrEqual(navTop);
}

test("the dashboard fits a 390 px phone screen", async ({ page, user }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: new RegExp(`${user.username}!$`) })).toBeVisible();
  await expect(page.locator(".stat-card")).toHaveCount(4);
  // The main action is on screen without scrolling.
  await expect(page.getByRole("link", { name: /Continue learning/ })).toBeInViewport({ ratio: 1 });

  // The stats go two per row instead of four.
  const [first, second, third] = await page.locator(".stat-card").all();
  const [a, b, c] = [await first.boundingBox(), await second.boundingBox(), await third.boundingBox()];
  expect(b.y).toBe(a.y);
  expect(c.y).toBeGreaterThan(a.y);

  await expectPhoneLayout(page);
});

test("the learning path fits a 390 px phone screen and opens a lesson with a tap", async ({
  page,
  user,
}) => {
  await page.goto("/learn");
  const firstLesson = page.getByRole("link", { name: "Hello! — start" });
  await expect(firstLesson).toBeVisible();

  await expectPhoneLayout(page);

  await page.evaluate(() => window.scrollTo(0, 0));
  const box = await firstLesson.boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(MIN_TAP_SIZE);
  expect(box.height).toBeGreaterThanOrEqual(MIN_TAP_SIZE);

  await firstLesson.tap();
  await expect(page).toHaveURL(/\/learn\/a1-u1-l1$/);
  // Lessons are full screen: no app navigation around them.
  await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
  expect(await elementsOffScreen(page), "elements past the screen edges").toEqual([]);
});

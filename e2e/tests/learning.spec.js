import { test, expect, uniqueUser } from "../fixtures.js";
import { playLesson } from "./helpers/lesson.js";

// The number in a dashboard stat card ("Day streak", "Total XP", …).
const stat = (page, label) =>
  page.locator(".stat-card", { hasText: label }).locator(".stat-value");

test("a new learner registers, finishes the first lesson and sees XP and streak on the dashboard", async ({
  page,
  usersToDelete,
}) => {
  const { username, email, password } = uniqueUser();
  usersToDelete.push(email);

  await test.step("register", async () => {
    await page.goto("/register");
    await page.getByLabel("Username").fill(username);
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByRole("heading", { name: new RegExp(`${username}!$`) })).toBeVisible();
    await expect(stat(page, "Day streak")).toHaveText("0");
    await expect(stat(page, "Total XP")).toHaveText("0");
  });

  await test.step("finish the first lesson with no mistakes", async () => {
    await page.getByRole("link", { name: /Continue learning/ }).click();
    await expect(page).toHaveURL(/\/learn\/a1-u1-l1$/);
    await playLesson(page, "a1-u1-l1");

    await expect(page.getByRole("heading", { name: "Lesson complete!" })).toBeVisible();
    await expect(page.getByLabel("3 of 3 stars")).toBeVisible();
    await expect(page.locator(".results-stats")).toContainText("100%");
    await expect(page.locator(".results-stats")).toContainText("+15");
  });

  await test.step("the next lesson is unlocked on the path", async () => {
    await page.getByRole("link", { name: "Back to path" }).click();
    await expect(page.getByRole("link", { name: "Hello! — completed, practice again" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Introductions — start" })).toBeVisible();
    // …and only that one: the unit checkpoint stays locked.
    await expect(page.getByLabel("First Words Checkpoint — locked")).toBeVisible();
  });

  await test.step("the dashboard shows the XP, the streak and the next lesson", async () => {
    await page.getByRole("link", { name: "Dashboard" }).click();
    await expect(stat(page, "Total XP")).toHaveText("15");
    await expect(stat(page, "Day streak")).toContainText("1");
    // The "+1" next to a streak that just went up must be readable even
    // with animations off. (Playwright counts opacity 0 as "visible".)
    const gain = page.getByText("+1", { exact: true });
    await expect(gain).toBeVisible();
    await expect(gain).toHaveCSS("opacity", "1");
    await expect(stat(page, "words learned")).toHaveText("6");
    await expect(page.locator(".continue-card")).toContainText("Introductions");
  });
});

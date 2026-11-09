import { test, expect, AUTH_COOKIE } from "../fixtures.js";

// Every page behind the login, including a lesson (full screen, no sidebar)
// and a flashcard deck.
const PROTECTED_PAGES = [
  "/",
  "/learn",
  "/learn/a1-u1-l1",
  "/flashcards",
  "/flashcards/favorites",
  "/translator",
  "/favorites",
];

test("logging out ends the session and protected pages redirect to the login", async ({
  page,
  context,
  user,
}) => {
  const loginButton = page.getByRole("button", { name: "Log in" });

  await test.step("log out from the dashboard", async () => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: new RegExp(`${user.username}!$`) })).toBeVisible();

    await page.getByRole("button", { name: "Log out" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(loginButton).toBeVisible();

    // The session cookie is gone, so the API no longer knows who this is.
    const cookies = await context.cookies();
    expect(cookies.map((c) => c.name)).not.toContain(AUTH_COOKIE);
    expect((await page.request.get("/api/auth/me")).status()).toBe(401);
  });

  await test.step("every protected page redirects to the login", async () => {
    for (const path of PROTECTED_PAGES) {
      await page.goto(path);
      await expect(page, `${path} without a session`).toHaveURL(/\/login$/);
      await expect(loginButton).toBeVisible();
    }
  });

  await test.step("logging in again returns to the page that was asked for", async () => {
    await page.goto("/favorites");
    await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel("Email").fill(user.email);
    await page.getByLabel("Password", { exact: true }).fill(user.password);
    await loginButton.click();

    await expect(page).toHaveURL(/\/favorites$/);
    await expect(page.getByRole("heading", { name: "Favorites" })).toBeVisible();
  });
});

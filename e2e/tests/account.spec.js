import { test, expect, AUTH_COOKIE } from "../fixtures.js";

test("deletes the account from the Account page", async ({ page, user }) => {
  await test.step("open the Account page from the avatar", async () => {
    await page.goto("/");
    await page.getByRole("link", { name: new RegExp(user.username) }).click();
    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByRole("heading", { name: "Account" })).toBeVisible();
    await expect(page.getByText("Signs in with email and password")).toBeVisible();
  });

  await test.step("confirm with the password", async () => {
    await page.getByRole("button", { name: "Delete account…" }).click();
    const submit = page.getByRole("button", { name: "Delete my account forever" });
    await expect(submit).toBeDisabled();
    await page.getByLabel("Enter your password to confirm").fill(user.password);
    await submit.click();
  });

  await test.step("the login page confirms it, and the account is gone", async () => {
    await expect(page).toHaveURL(/\/login\?deleted=1$/);
    await expect(page.getByRole("status")).toHaveText("Your account and all its data were deleted.");

    const login = await page.request.post("/api/auth/login", {
      data: { email: user.email, password: user.password },
    });
    expect(login.status()).toBe(401);
  });
});

test("logging out on one device ends the session on another", async ({
  page,
  context,
  browser,
  baseURL,
  user,
}) => {
  // The same session cookie in a second browser: another device, or a copy.
  const otherDevice = await browser.newContext({ baseURL });
  await otherDevice.addCookies(
    (await context.cookies()).filter((cookie) => cookie.name === AUTH_COOKIE),
  );
  const other = await otherDevice.newPage();
  await other.goto("/favorites");
  await expect(other.getByRole("heading", { name: "Favorites" })).toBeVisible();

  await page.goto("/");
  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/login$/);

  await other.reload();
  await expect(other).toHaveURL(/\/login$/);
  await otherDevice.close();
});

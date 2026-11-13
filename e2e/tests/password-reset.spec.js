import { test, expect } from "../fixtures.js";
import { emailTo } from "../outbox.js";

const NEW_PASSWORD = "BrandNew456";

test("someone who forgot the password gets a link by email and logs in with a new one", async ({
  page,
  account,
}) => {
  await test.step("ask for a link from the login page", async () => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(account.email);
    await page.getByRole("link", { name: "Forgot password?" }).click();

    await expect(page).toHaveURL(/\/forgot-password$/);
    await expect(page.getByLabel("Email")).toHaveValue(account.email);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByRole("status")).toContainText("we've sent it a link");
  });

  let linkPath;
  await test.step("the email has a link to choose a new password", async () => {
    const mail = await emailTo(account.email, /Reset your/);
    const link = new URL(mail.text.match(/https?:\/\/\S+\/reset-password#token=\S+/)[0]);
    // The link points at the configured client URL; open it on this server.
    linkPath = `${link.pathname}${link.hash}`;
  });

  await test.step("choose the new password", async () => {
    await page.goto(linkPath);
    // The token is out of the address bar as soon as the page reads it.
    await expect(page).toHaveURL(/\/reset-password$/);

    await page.getByLabel("New password").fill(NEW_PASSWORD);
    await page.getByRole("button", { name: "Set new password" }).click();

    await expect(page).toHaveURL(/\/login\?reset=1$/);
    await expect(page.getByRole("status")).toHaveText(
      "Your password was changed. Log in with the new one.",
    );
  });

  await test.step("log in with it", async () => {
    await page.getByLabel("Email").fill(account.email);
    await page.getByLabel("Password", { exact: true }).fill(NEW_PASSWORD);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(
      page.getByRole("heading", { name: new RegExp(`${account.username}!$`) }),
    ).toBeVisible();
  });

  await test.step("the old password no longer works", async () => {
    const res = await page.request.post("/api/auth/login", {
      data: { email: account.email, password: account.password },
    });
    expect(res.status()).toBe(401);
  });
});

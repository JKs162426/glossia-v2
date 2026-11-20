import { test, expect } from "../fixtures.js";

// The fonts ship with the app, so the Content-Security-Policy can allow
// styles and fonts from the site only. A blocked file would also show up as
// a console error, which fails every test (fixtures.js).
test("fonts load from the site itself under the strict CSP", async ({ page, baseURL, user }) => {
  const otherOrigins = [];
  page.on("request", (request) => {
    if (!request.url().startsWith(baseURL)) otherOrigins.push(request.url());
  });

  const response = await page.goto("/");
  await expect(page.getByRole("heading", { name: new RegExp(`${user.username}!$`) })).toBeVisible();

  const policy = response.headers()["content-security-policy"];
  expect(policy).toContain("style-src 'self';");
  expect(policy).toContain("font-src 'self';");
  expect(policy).not.toContain("unsafe-inline");

  // Families with at least one face the browser actually downloaded.
  const loaded = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family.replaceAll('"', ""));
  });
  expect(new Set(loaded)).toEqual(new Set(["Inter Variable", "Space Grotesk Variable"]));
  expect(otherOrigins).toEqual([]);
});

import { test, expect } from "../fixtures.js";

test("translates a phrase, saves it as a favorite and removes it", async ({ page, user }) => {
  // The browser calls MyMemory directly. The tests never reach the real
  // service (it has a daily quota and can be slow): Playwright answers with
  // a body shaped like its real responses.
  const requests = [];
  await page.route("https://api.mymemory.translated.net/**", (route) => {
    requests.push(new URL(route.request().url()).searchParams);
    return route.fulfill({
      headers: { "Access-Control-Allow-Origin": "*" },
      json: { responseStatus: 200, responseData: { translatedText: "buenos días" } },
    });
  });

  await test.step("translate from the reference language into the one being learned", async () => {
    await page.goto("/translator");
    // Learning Spanish (the default), so it translates English → Spanish.
    await expect(page.getByLabel("Translate from")).toHaveValue("en");
    await expect(page.getByLabel("Translate to")).toHaveValue("es");

    await page.getByLabel("Text to translate").fill("good morning");
    await page.getByRole("button", { name: /^Translate/ }).click();

    await expect(page.locator(".result-text")).toHaveText("buenos días");
    expect(requests).toHaveLength(1);
    expect(requests[0].get("q")).toBe("good morning");
    expect(requests[0].get("langpair")).toBe("en|es");
  });

  await test.step("save it to favorites", async () => {
    await page.getByRole("button", { name: "Save to favorites" }).click();
    await expect(page.getByRole("button", { name: "Saved!" })).toBeDisabled();
    await expect(page.getByText("Saved as a Spanish word.")).toBeVisible();
  });

  const favorite = page.getByRole("article").filter({ hasText: "buenos días" });

  await test.step("it appears in Favorites as a Spanish word", async () => {
    await page.getByRole("link", { name: "View favorites" }).click();
    await expect(page).toHaveURL(/\/favorites$/);
    await expect(favorite.getByRole("heading", { name: "buenos días" })).toBeVisible();
    await expect(favorite).toContainText("good morning");
    await expect(favorite).toContainText("Spanish");
    await expect(page.getByRole("link", { name: "Practice 1 Spanish word" })).toBeVisible();
  });

  await test.step("remove it, and it stays removed after a reload", async () => {
    // The list empties before the server answers (optimistic update), so
    // there's nothing on screen to wait for: wait for the server instead,
    // or the reload below could cancel the request.
    const deleted = page.waitForResponse(
      (res) => res.request().method() === "DELETE" && res.url().includes("/api/favorites/"),
    );
    await page.getByRole("button", { name: "Remove buenos días from favorites" }).click();
    await expect(favorite).toHaveCount(0);
    await expect(page.getByText("No favorites yet.")).toBeVisible();
    expect((await deleted).ok()).toBe(true);

    // Only a reload proves the favorite was deleted for real.
    await page.reload();
    await expect(page.getByText("No favorites yet.")).toBeVisible();
    await expect(favorite).toHaveCount(0);
  });
});

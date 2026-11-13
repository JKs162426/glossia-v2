import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ResetPassword from "./ResetPassword";

const api = vi.hoisted(() => ({ post: vi.fn() }));
const navigation = vi.hoisted(() => ({ reloadAt: vi.fn() }));
vi.mock("../services/api", () => ({ default: api, API_URL: "/api" }));
vi.mock("../lib/navigation", () => navigation);

const TOKEN = "a".repeat(43);

// The component reads the token from the real address bar, as in the browser.
const openLink = (hash) => {
  window.history.replaceState(null, "", `/reset-password${hash}`);
  render(
    <MemoryRouter>
      <ResetPassword />
    </MemoryRouter>,
  );
};

const typePassword = (value) =>
  fireEvent.change(screen.getByLabelText("New password"), { target: { value } });

beforeEach(() => {
  api.post.mockReset();
  navigation.reloadAt.mockReset();
});

describe("ResetPassword", () => {
  it("takes the token out of the address bar", () => {
    openLink(`#token=${TOKEN}`);
    expect(window.location.hash).toBe("");
    expect(window.location.pathname).toBe("/reset-password");
  });

  it("waits for a valid password, then saves it and goes to the login page", async () => {
    api.post.mockResolvedValue({ data: { message: "Password updated" } });
    openLink(`#token=${TOKEN}`);

    const submit = screen.getByRole("button", { name: "Set new password" });
    typePassword("nodigits");
    expect(submit).toBeDisabled();
    typePassword("BrandNew456");
    fireEvent.click(submit);

    await waitFor(() => expect(navigation.reloadAt).toHaveBeenCalledWith("/login?reset=1"));
    expect(api.post).toHaveBeenCalledWith("/auth/reset-password", {
      token: TOKEN,
      password: "BrandNew456",
    });
  });

  it("offers a new link when the server refuses this one", async () => {
    const message = "This link is invalid or has expired. Ask for a new one.";
    api.post.mockRejectedValue(
      Object.assign(new Error("400"), { response: { status: 400, data: { message } } }),
    );
    openLink(`#token=${TOKEN}`);

    typePassword("BrandNew456");
    fireEvent.click(screen.getByRole("button", { name: "Set new password" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(message);
    expect(screen.getByRole("link", { name: "Get a new link" })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
    expect(navigation.reloadAt).not.toHaveBeenCalled();
  });

  it("without a token there's no form, just the way to get a new link", () => {
    openLink("");
    expect(screen.getByRole("alert")).toHaveTextContent("This link is incomplete");
    expect(screen.queryByLabelText("New password")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Get a new link" })).toBeInTheDocument();
  });
});

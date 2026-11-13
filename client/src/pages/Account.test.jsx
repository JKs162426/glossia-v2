import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Account from "./Account";

const auth = vi.hoisted(() => ({ user: null }));
const api = vi.hoisted(() => ({ delete: vi.fn() }));
const navigation = vi.hoisted(() => ({ reloadAt: vi.fn() }));

vi.mock("../context/auth-context", () => ({ useAuth: () => auth }));
vi.mock("../services/api", () => ({ default: api, API_URL: "/api" }));
vi.mock("../lib/navigation", () => navigation);

const passwordUser = { id: 1, username: "ana", email: "ana@example.com", has_password: true };
const googleUser = { ...passwordUser, has_password: false };

const renderAccount = (user) => {
  auth.user = user;
  render(<Account />);
};

const typePassword = (value) =>
  fireEvent.change(screen.getByLabelText("Enter your password to confirm"), {
    target: { value },
  });

const rejectWith = (status, data) =>
  Object.assign(new Error("Request failed"), { response: { status, data } });

beforeEach(() => {
  navigation.reloadAt.mockReset();
  api.delete.mockReset();
});

describe("Account: delete account", () => {
  it("asks for the password, then deletes and goes to the login page", async () => {
    renderAccount(passwordUser);
    api.delete.mockResolvedValue({ status: 204 });

    fireEvent.click(screen.getByRole("button", { name: "Delete account…" }));
    const submit = screen.getByRole("button", { name: "Delete my account forever" });
    expect(submit).toBeDisabled();

    typePassword("Password123");
    fireEvent.click(submit);

    await waitFor(() => expect(navigation.reloadAt).toHaveBeenCalledWith("/login?deleted=1"));
    expect(api.delete).toHaveBeenCalledWith("/users/me", { data: { password: "Password123" } });
  });

  it("shows the server's message on a wrong password and keeps the user here", async () => {
    renderAccount(passwordUser);
    api.delete.mockRejectedValue(rejectWith(403, { message: "Incorrect password" }));

    fireEvent.click(screen.getByRole("button", { name: "Delete account…" }));
    typePassword("Wrong1234");
    fireEvent.click(screen.getByRole("button", { name: "Delete my account forever" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect password");
    expect(navigation.reloadAt).not.toHaveBeenCalled();
    // The button is usable again for another try.
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Delete my account forever" })).toBeEnabled(),
    );
  });

  it("doesn't ask a Google account for a password, and links to Google when it must sign in again", async () => {
    renderAccount(googleUser);
    api.delete.mockRejectedValue(
      rejectWith(403, { message: "Sign in with Google again to delete your account.", reauth: true }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete account…" }));
    expect(screen.queryByLabelText("Enter your password to confirm")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Delete my account forever" }));

    expect(await screen.findByRole("link", { name: "Sign in with Google" })).toHaveAttribute(
      "href",
      "/api/auth/google",
    );
    expect(api.delete).toHaveBeenCalledWith("/users/me", { data: {} });
  });

  it("“Keep my account” closes the confirmation without deleting", async () => {
    renderAccount(passwordUser);

    fireEvent.click(screen.getByRole("button", { name: "Delete account…" }));
    fireEvent.click(screen.getByRole("button", { name: "Keep my account" }));

    expect(screen.getByRole("button", { name: "Delete account…" })).toBeInTheDocument();
    expect(api.delete).not.toHaveBeenCalled();
  });
});

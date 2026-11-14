import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ForgotPassword from "./ForgotPassword";

const api = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("../services/api", () => ({ default: api, API_URL: "/api" }));

const SENT = "If there's an account with that email, we've sent it a link to choose a new password.";

const renderPage = (state) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: "/forgot-password", state }]}>
      <ForgotPassword />
    </MemoryRouter>,
  );

beforeEach(() => api.post.mockReset());

describe("ForgotPassword", () => {
  it("sends the email and shows the server's answer instead of the form", async () => {
    api.post.mockResolvedValue({ data: { message: SENT } });
    renderPage();

    const submit = screen.getByRole("button", { name: "Send reset link" });
    expect(submit).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: " ana@example.com " } });
    fireEvent.click(submit);

    expect(await screen.findByRole("status")).toHaveTextContent(SENT);
    expect(api.post).toHaveBeenCalledWith("/auth/forgot-password", { email: "ana@example.com" });
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
  });

  it("starts with the email typed on the login page", () => {
    renderPage({ email: "ana@example.com" });
    expect(screen.getByLabelText("Email")).toHaveValue("ana@example.com");
  });

  it("shows the error and keeps the form when the request fails", async () => {
    api.post.mockRejectedValueOnce(
      Object.assign(new Error("Request failed"), {
        response: { status: 429, data: { message: "Too many requests. Try again in 15 minutes." } },
      }),
    );
    renderPage({ email: "ana@example.com" });

    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Too many requests");
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });
});

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Icon, LanguageMark } from "./Icon";

describe("<Icon>", () => {
  it("renders a decorative SVG hidden from screen readers", () => {
    const { container } = render(<Icon name="star" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("is announced when it has a label", () => {
    render(<Icon name="speaker" label="Listen" />);
    expect(screen.getByRole("img", { name: "Listen" })).toBeInTheDocument();
  });

  it("falls back to the default icon for unknown names (e.g. old emoji)", () => {
    const { container } = render(<Icon name="🐾" />);
    expect(container.querySelector("svg path")).toBeInTheDocument();
  });
});

describe("<LanguageMark>", () => {
  it("shows the native initials of the language", () => {
    const { container, rerender } = render(<LanguageMark code="ru" />);
    expect(container).toHaveTextContent("Ру");
    rerender(<LanguageMark code="zh" />);
    expect(container).toHaveTextContent("中");
  });
});

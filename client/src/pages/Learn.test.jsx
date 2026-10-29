import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import Learn from "./Learn";

const node = (id, status, type = "lesson") => ({
  id,
  type,
  status,
  title: id,
  wordCount: 6,
  stars: status === "completed" ? 3 : 0,
});

// What GET /api/learn/path returns right after finishing the first lesson.
vi.mock("../hooks/useApi", () => ({
  useApi: () => ({
    loading: false,
    error: null,
    data: {
      levels: [
        {
          id: "A1",
          title: "Beginner",
          description: "",
          completed: 1,
          total: 3,
          units: [
            {
              id: "a1-u1",
              title: "First Words",
              icon: "chat",
              nodes: [
                node("a1-u1-l1", "completed"),
                node("a1-u1-l2", "current"),
                node("a1-u1-test", "locked", "checkpoint"),
              ],
            },
          ],
        },
      ],
    },
  }),
}));
vi.mock("../context/language-context", () => ({ useLanguage: () => ({ targetLanguage: "es" }) }));

// Shows the router's history state so the test can read it.
function StateSpy() {
  return <output data-testid="history-state">{JSON.stringify(useLocation().state)}</output>;
}

const renderLearn = (state) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: "/learn", state }]}>
      <Routes>
        <Route
          path="/learn"
          element={
            <>
              <Learn />
              <StateSpy />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

const nodeEl = (id) => document.querySelector(`[data-node-id="${id}"]`);

describe("<Learn> unlock animation", () => {
  it("marks the finished node and the one it unlocked, with a lock to shake off", () => {
    renderLearn({ justCompleted: "a1-u1-l1" });

    expect(nodeEl("a1-u1-l1")).toHaveClass("just-completed");
    expect(nodeEl("a1-u1-l2")).toHaveClass("current", "just-unlocked");
    expect(nodeEl("a1-u1-l2").querySelector(".unlock-lock")).toBeInTheDocument();
    expect(nodeEl("a1-u1-test")).not.toHaveClass("just-unlocked");
  });

  it("clears the history state so a reload doesn't replay it, but keeps animating", () => {
    renderLearn({ justCompleted: "a1-u1-l1" });
    expect(screen.getByTestId("history-state")).toHaveTextContent("null");
    expect(nodeEl("a1-u1-l2")).toHaveClass("just-unlocked");
  });

  it("animates nothing on a normal visit", () => {
    renderLearn(undefined);
    expect(document.querySelector(".just-completed, .just-unlocked")).toBeNull();
    expect(screen.getByText("Start")).toBeInTheDocument();
  });
});

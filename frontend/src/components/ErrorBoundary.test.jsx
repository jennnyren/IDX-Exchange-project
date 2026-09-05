import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import ErrorBoundary from "./ErrorBoundary";

function Bomb({ shouldThrowRef }) {
  if (shouldThrowRef.current) {
    throw new Error("boom");
  }
  return <p>All good</p>;
}

function renderBoundary(shouldThrowRef) {
  return render(
    <MemoryRouter>
      <ErrorBoundary>
        <Bomb shouldThrowRef={shouldThrowRef} />
      </ErrorBoundary>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

describe("ErrorBoundary", () => {
  it("renders children normally when nothing throws", () => {
    renderBoundary({ current: false });

    expect(screen.getByText("All good")).toBeInTheDocument();
  });

  it("shows a fallback UI when a child throws during render", () => {
    renderBoundary({ current: true });

    expect(
      screen.getByText("Something went wrong displaying this page."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to listings" })).toBeInTheDocument();
  });

  it("clears the error and re-renders children when Try again is clicked", async () => {
    const user = userEvent.setup();
    const shouldThrowRef = { current: true };

    renderBoundary(shouldThrowRef);
    expect(
      screen.getByText("Something went wrong displaying this page."),
    ).toBeInTheDocument();

    // Simulate the underlying problem being resolved before the retry.
    shouldThrowRef.current = false;
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(screen.getByText("All good")).toBeInTheDocument();
    expect(
      screen.queryByText("Something went wrong displaying this page."),
    ).not.toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PropertyImageCarousel from "./PropertyImageCarousel";

describe("PropertyImageCarousel", () => {
  it("shows a 'No photo' placeholder when there are no photos", () => {
    render(<PropertyImageCarousel photos={[]} alt="123 Main St" />);
    expect(screen.getByText("No photo")).toBeInTheDocument();
  });

  it("does not show arrows or a counter for a single photo", () => {
    render(<PropertyImageCarousel photos={["a.jpg"]} alt="123 Main St" />);
    expect(screen.queryByLabelText("Next photo")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Previous photo")).not.toBeInTheDocument();
  });

  it("cycles forward and wraps around with Next", async () => {
    const user = userEvent.setup();
    render(
      <PropertyImageCarousel photos={["a.jpg", "b.jpg", "c.jpg"]} alt="x" />,
    );

    expect(screen.getByText("1 / 3")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Next photo"));
    expect(screen.getByText("2 / 3")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Next photo"));
    await user.click(screen.getByLabelText("Next photo"));
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("cycles backward and wraps around with Prev", async () => {
    const user = userEvent.setup();
    render(<PropertyImageCarousel photos={["a.jpg", "b.jpg"]} alt="x" />);

    await user.click(screen.getByLabelText("Previous photo"));
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  });

  it("stops propagation so clicking an arrow doesn't trigger a parent click handler", async () => {
    const user = userEvent.setup();
    const parentClick = vi.fn();
    render(
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      <div onClick={parentClick}>
        <PropertyImageCarousel photos={["a.jpg", "b.jpg"]} alt="x" />
      </div>,
    );

    await user.click(screen.getByLabelText("Next photo"));
    expect(parentClick).not.toHaveBeenCalled();
  });
});

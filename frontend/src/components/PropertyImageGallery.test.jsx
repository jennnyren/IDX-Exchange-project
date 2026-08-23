import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PropertyImageGallery from "./PropertyImageGallery";

describe("PropertyImageGallery", () => {
  it("shows a placeholder when there are no photos", () => {
    render(<PropertyImageGallery photos={[]} alt="123 Main St" />);
    expect(screen.getByText("No photos available")).toBeInTheDocument();
  });

  it("shows the main image and a thumbnail per photo", () => {
    render(
      <PropertyImageGallery photos={["a.jpg", "b.jpg"]} alt="123 Main St" />,
    );
    expect(screen.getByAltText("123 Main St")).toHaveAttribute("src", "a.jpg");
    expect(screen.getByAltText("123 Main St thumbnail 1")).toBeInTheDocument();
    expect(screen.getByAltText("123 Main St thumbnail 2")).toBeInTheDocument();
  });

  it("switches the main image when a thumbnail is clicked", async () => {
    const user = userEvent.setup();
    render(
      <PropertyImageGallery photos={["a.jpg", "b.jpg"]} alt="123 Main St" />,
    );

    await user.click(screen.getByAltText("123 Main St thumbnail 2"));
    expect(screen.getByAltText("123 Main St")).toHaveAttribute("src", "b.jpg");
  });

  it("opens a lightbox when the main image is clicked, and closes on backdrop click", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <PropertyImageGallery photos={["a.jpg"]} alt="123 Main St" />,
    );

    await user.click(screen.getByAltText("123 Main St"));
    expect(screen.getAllByAltText("123 Main St")).toHaveLength(2);

    await user.click(container.querySelector(".lightbox-backdrop"));
    expect(screen.getAllByAltText("123 Main St")).toHaveLength(1);
  });

  it("closes the lightbox via the close button", async () => {
    const user = userEvent.setup();
    render(<PropertyImageGallery photos={["a.jpg"]} alt="123 Main St" />);

    await user.click(screen.getByAltText("123 Main St"));
    await user.click(screen.getByLabelText("Close"));
    expect(screen.getAllByAltText("123 Main St")).toHaveLength(1);
  });
});

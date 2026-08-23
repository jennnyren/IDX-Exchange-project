import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";

describe("PropertyMap", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("renders an iframe pointed at the property's coordinates when lat/lng and an API key are present", async () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "test-key");
    const { default: PropertyMap } = await import("./PropertyMap");
    render(<PropertyMap latitude={42.36} longitude={-71.06} />);

    const iframe = screen.getByTitle("Property location");
    expect(iframe).toHaveAttribute(
      "src",
      expect.stringContaining("q=42.36,-71.06"),
    );
    expect(iframe).toHaveAttribute(
      "src",
      expect.stringContaining("key=test-key"),
    );
  });

  it("shows a fallback message when coordinates are missing", async () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "test-key");
    const { default: PropertyMap } = await import("./PropertyMap");
    render(<PropertyMap latitude={null} longitude={null} />);

    expect(
      screen.getByText("Map unavailable for this property."),
    ).toBeInTheDocument();
  });

  it("shows a fallback message when the API key is missing", async () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "");
    const { default: PropertyMap } = await import("./PropertyMap");
    render(<PropertyMap latitude={42.36} longitude={-71.06} />);

    expect(screen.getByText(/missing API key/)).toBeInTheDocument();
  });
});

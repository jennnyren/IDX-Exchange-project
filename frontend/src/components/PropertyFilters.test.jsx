import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PropertyFilters from "./PropertyFilters";

describe("PropertyFilters", () => {
  it("renders all six filter inputs", () => {
    render(<PropertyFilters onSearch={vi.fn()} onClear={vi.fn()} />);

    expect(screen.getByPlaceholderText("City")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("ZIP code")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Min price")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Max price")).toBeInTheDocument();
    expect(screen.getAllByRole("combobox")).toHaveLength(2); // beds + baths
  });

  it("calls onSearch with the entered filter values on submit", async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<PropertyFilters onSearch={onSearch} onClear={vi.fn()} />);

    await user.type(screen.getByPlaceholderText("City"), "Boston");
    await user.type(screen.getByPlaceholderText("Min price"), "200000");
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(onSearch).toHaveBeenCalledWith(
      expect.objectContaining({ city: "Boston", minPrice: "200000" }),
    );
  });

  it("resets the form fields and calls onClear when Clear Filters is clicked", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(<PropertyFilters onSearch={vi.fn()} onClear={onClear} />);

    const cityInput = screen.getByPlaceholderText("City");
    await user.type(cityInput, "Boston");
    expect(cityInput).toHaveValue("Boston");

    await user.click(screen.getByRole("button", { name: "Clear Filters" }));

    expect(cityInput).toHaveValue("");
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});

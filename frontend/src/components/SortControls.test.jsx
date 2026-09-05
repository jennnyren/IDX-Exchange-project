import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SortControls from "./SortControls";

describe("SortControls", () => {
  it("renders the default option as selected when no sort is active", () => {
    render(<SortControls value={{}} onChange={vi.fn()} />);

    expect(screen.getByRole("combobox")).toHaveValue("");
  });

  it("calls onChange with the parsed sortBy/sortOrder when an option is selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SortControls value={{}} onChange={onChange} />);

    await user.selectOptions(screen.getByRole("combobox"), "Price: Low to High");

    expect(onChange).toHaveBeenCalledWith({ sortBy: "price", sortOrder: "asc" });
  });

  it("calls onChange with an empty object when Default is re-selected", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <SortControls
        value={{ sortBy: "price", sortOrder: "asc" }}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole("combobox")).toHaveValue("price-asc");

    await user.selectOptions(screen.getByRole("combobox"), "Sort: Default");

    expect(onChange).toHaveBeenCalledWith({});
  });
});

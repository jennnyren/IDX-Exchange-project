import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import ListingsPage from "./ListingsPage";
import { fetchProperties } from "../api/properties";

vi.mock("../api/properties", () => ({
  fetchProperties: vi.fn(),
}));

function renderListingsPage() {
  return render(
    <MemoryRouter>
      <ListingsPage />
    </MemoryRouter>,
  );
}

function makeProperty(id) {
  return {
    L_ListingID: id,
    L_Photos: "[]",
    L_SystemPrice: 300000,
    L_Address: `${id} Main St`,
    L_City: "Boston",
    L_State: "MA",
    L_Keyword2: 3,
    LM_Dec_3: 2,
    LM_Int2_3: 1500,
  };
}

function respondWith(total) {
  return ({ limit, offset }) => {
    const count = Math.max(0, Math.min(limit, total - offset));
    const results = Array.from({ length: count }, (_, i) =>
      makeProperty(offset + i + 1),
    );
    return Promise.resolve({ total, limit, offset, results });
  };
}

describe("ListingsPage pagination", () => {
  beforeEach(() => {
    fetchProperties.mockReset();
    window.scrollTo = vi.fn();
  });

  it("shows a results summary in the form 'Showing X-Y of Z properties'", async () => {
    fetchProperties.mockImplementation(respondWith(45));
    renderListingsPage();

    expect(
      await screen.findByText("Showing 1-20 of 45 properties"),
    ).toBeInTheDocument();
  });

  it("hides pagination controls when there is only one page", async () => {
    fetchProperties.mockImplementation(respondWith(5));
    renderListingsPage();

    await screen.findByText("Showing 1-5 of 5 properties");
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
  });

  it("preserves active filters and scrolls to top when changing pages", async () => {
    const user = userEvent.setup();
    fetchProperties.mockImplementation(respondWith(45));
    renderListingsPage();

    await screen.findByText("Showing 1-20 of 45 properties");

    await user.type(screen.getByPlaceholderText("City"), "Boston");
    await user.click(screen.getByRole("button", { name: "Search" }));

    await screen.findByText("Showing 1-20 of 45 properties");
    expect(fetchProperties).toHaveBeenLastCalledWith(
      expect.objectContaining({ offset: 0, city: "Boston" }),
    );

    await user.click(screen.getByRole("button", { name: "Next" }));

    await screen.findByText("Showing 21-40 of 45 properties");
    expect(fetchProperties).toHaveBeenLastCalledWith(
      expect.objectContaining({ offset: 20, city: "Boston" }),
    );
    expect(window.scrollTo).toHaveBeenCalled();
  });

  it("resets to page 1 when new filters are applied", async () => {
    const user = userEvent.setup();
    fetchProperties.mockImplementation(respondWith(45));
    renderListingsPage();

    await screen.findByText("Showing 1-20 of 45 properties");

    await user.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("Showing 21-40 of 45 properties");

    await user.type(screen.getByPlaceholderText("City"), "Cambridge");
    await user.click(screen.getByRole("button", { name: "Search" }));

    await screen.findByText("Showing 1-20 of 45 properties");
    expect(fetchProperties).toHaveBeenLastCalledWith(
      expect.objectContaining({ offset: 0, city: "Cambridge" }),
    );
  });

  it("preserves the active sort when changing pages", async () => {
    const user = userEvent.setup();
    fetchProperties.mockImplementation(respondWith(45));
    renderListingsPage();

    await screen.findByText("Showing 1-20 of 45 properties");

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Sort properties" }),
      "Price: Low to High",
    );
    await screen.findByText("Showing 1-20 of 45 properties");
    expect(fetchProperties).toHaveBeenLastCalledWith(
      expect.objectContaining({ sortBy: "price", sortOrder: "asc" }),
    );

    await user.click(screen.getByRole("button", { name: "Next" }));

    await screen.findByText("Showing 21-40 of 45 properties");
    expect(fetchProperties).toHaveBeenLastCalledWith(
      expect.objectContaining({ offset: 20, sortBy: "price", sortOrder: "asc" }),
    );
  });

  it("resets the sort when new filters are applied", async () => {
    const user = userEvent.setup();
    fetchProperties.mockImplementation(respondWith(45));
    renderListingsPage();

    await screen.findByText("Showing 1-20 of 45 properties");

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Sort properties" }),
      "Price: Low to High",
    );
    await screen.findByText("Showing 1-20 of 45 properties");

    await user.type(screen.getByPlaceholderText("City"), "Cambridge");
    await user.click(screen.getByRole("button", { name: "Search" }));

    await screen.findByText("Showing 1-20 of 45 properties");
    const lastCallArgs = fetchProperties.mock.calls.at(-1)[0];
    expect(lastCallArgs).toMatchObject({ city: "Cambridge" });
    expect(lastCallArgs.sortBy).toBeUndefined();
    expect(lastCallArgs.sortOrder).toBeUndefined();
    expect(
      screen.getByRole("combobox", { name: "Sort properties" }),
    ).toHaveValue("");
  });
});

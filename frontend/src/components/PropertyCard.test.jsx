import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import userEvent from "@testing-library/user-event";

const property = {
  L_ListingID: "123",
  L_Photos: "[]",
  L_SystemPrice: 300000,
  L_Address: "1 Main St",
  L_City: "Boston",
  L_State: "MA",
  L_Keyword2: 3,
  LM_Dec_3: 2,
  LM_Int2_3: 1500,
};

// PropertyCard's favorites state lives in useFavorites' module-level store,
// so each test resets modules and re-imports PropertyCard fresh to isolate
// the store (mirroring the pattern in useFavorites.test.js).
async function renderCard() {
  const { default: PropertyCard } = await import("./PropertyCard");
  return render(
    <MemoryRouter>
      <PropertyCard property={property} />
    </MemoryRouter>,
  );
}

// Renders the card inside a router that also has the detail route mounted, so
// clicking through can be asserted on the destination that actually renders.
async function renderCardWithDetailRoute() {
  const { default: PropertyCard } = await import("./PropertyCard");
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<PropertyCard property={property} />} />
        <Route
          path="/property/:id"
          element={<h2>Detail page for 123</h2>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  vi.resetModules();
});

describe("PropertyCard rendering", () => {
  it("formats the price with thousands separators", async () => {
    await renderCard();

    expect(screen.getByText("$300,000")).toBeInTheDocument();
  });

  it("renders the address and city/state", async () => {
    await renderCard();

    expect(screen.getByText("1 Main St")).toBeInTheDocument();
    expect(screen.getByText("Boston, MA")).toBeInTheDocument();
  });

  it("renders beds, baths, and square footage", async () => {
    await renderCard();

    expect(screen.getByText("3 bd | 2 ba | 1,500 sqft")).toBeInTheDocument();
  });

  it("links to the detail route for the listing id", async () => {
    await renderCard();

    expect(screen.getByRole("link")).toHaveAttribute("href", "/property/123");
  });
});

describe("PropertyCard navigation", () => {
  it("navigates to the detail page when the card is clicked", async () => {
    const user = userEvent.setup();
    await renderCardWithDetailRoute();

    expect(screen.queryByText("Detail page for 123")).not.toBeInTheDocument();

    await user.click(screen.getByRole("link"));

    expect(screen.getByText("Detail page for 123")).toBeInTheDocument();
  });

  it("does not navigate when the favorite button is clicked", async () => {
    const user = userEvent.setup();
    await renderCardWithDetailRoute();

    await user.click(screen.getByRole("button", { name: "Add to favorites" }));

    expect(screen.queryByText("Detail page for 123")).not.toBeInTheDocument();
  });
});

describe("PropertyCard favorite button", () => {
  it("shows the empty heart when not favorited", async () => {
    await renderCard();

    expect(
      screen.getByRole("button", { name: "Add to favorites" }),
    ).toHaveTextContent("♡");
  });

  it("toggles to the filled heart on click without navigating", async () => {
    const user = userEvent.setup();
    await renderCard();

    await user.click(screen.getByRole("button", { name: "Add to favorites" }));

    expect(
      screen.getByRole("button", { name: "Remove from favorites" }),
    ).toHaveTextContent("♥");
    // Still on the same page — MemoryRouter didn't navigate to the detail route.
    expect(screen.getByRole("link")).toBeInTheDocument();
  });

  it("unfavorites on a second click", async () => {
    const user = userEvent.setup();
    await renderCard();

    await user.click(screen.getByRole("button", { name: "Add to favorites" }));
    await user.click(
      screen.getByRole("button", { name: "Remove from favorites" }),
    );

    expect(
      screen.getByRole("button", { name: "Add to favorites" }),
    ).toBeInTheDocument();
  });
});

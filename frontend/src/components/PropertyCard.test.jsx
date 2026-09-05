import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
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

beforeEach(() => {
  window.localStorage.clear();
  vi.resetModules();
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

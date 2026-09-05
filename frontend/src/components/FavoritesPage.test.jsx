import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const propertyA = {
  L_ListingID: "1",
  L_Photos: "[]",
  L_SystemPrice: 300000,
  L_Address: "1 Main St",
  L_City: "Boston",
  L_State: "MA",
  L_Keyword2: 3,
  LM_Dec_3: 2,
  LM_Int2_3: 1500,
};

const propertyB = { ...propertyA, L_ListingID: "2", L_Address: "2 Main St" };

// FavoritesPage reads from useFavorites' module-level store, so each test
// resets modules and re-imports fresh to isolate the store between tests.
async function renderFavoritesPage() {
  const { default: FavoritesPage } = await import("./FavoritesPage");
  return render(
    <MemoryRouter>
      <FavoritesPage />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  vi.resetModules();
});

describe("FavoritesPage", () => {
  it("shows an empty state when there are no favorites", async () => {
    await renderFavoritesPage();

    expect(screen.getByText(/no favorites yet/i)).toBeInTheDocument();
  });

  it("renders only the saved favorite properties", async () => {
    window.localStorage.setItem(
      "favoriteProperties",
      JSON.stringify({ 1: propertyA, 2: propertyB }),
    );

    await renderFavoritesPage();

    expect(screen.getByText("1 Main St")).toBeInTheDocument();
    expect(screen.getByText("2 Main St")).toBeInTheDocument();
    expect(screen.queryByText(/no favorites yet/i)).not.toBeInTheDocument();
  });
});

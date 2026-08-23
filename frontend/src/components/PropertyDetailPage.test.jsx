import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import PropertyDetailPage from "./PropertyDetailPage";
import { fetchPropertyById, fetchOpenHouses } from "../api/properties";

vi.mock("../api/properties", () => ({
  fetchPropertyById: vi.fn(),
  fetchOpenHouses: vi.fn(),
}));

function renderDetailPage(id = "42") {
  return render(
    <MemoryRouter initialEntries={[`/property/${id}`]}>
      <Routes>
        <Route path="/property/:id" element={<PropertyDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

function makeProperty(overrides = {}) {
  return {
    L_ListingID: "42",
    L_Photos: '["a.jpg", "b.jpg"]',
    L_SystemPrice: 500000,
    L_Address: "123 Main St",
    L_City: "Boston",
    L_State: "MA",
    L_Zip: "02118",
    L_Keyword2: 3,
    LM_Dec_3: 2,
    LM_Int2_3: 1800,
    YearBuilt: 1990,
    L_Remarks: "A lovely home.",
    LMD_MP_Latitude: 42.34,
    LMD_MP_Longitude: -71.09,
    ...overrides,
  };
}

describe("PropertyDetailPage", () => {
  beforeEach(() => {
    fetchPropertyById.mockReset();
    fetchOpenHouses.mockReset();
  });

  it("shows property fields once loaded", async () => {
    fetchPropertyById.mockResolvedValue(makeProperty());
    fetchOpenHouses.mockResolvedValue([]);

    renderDetailPage();

    expect(await screen.findByText("123 Main St")).toBeInTheDocument();
    expect(screen.getByText("$500,000")).toBeInTheDocument();
    expect(
      screen.getByText(/3 bd \| 2 ba \| 1,800 sqft \| Built 1990/),
    ).toBeInTheDocument();
    expect(screen.getByText("A lovely home.")).toBeInTheDocument();
  });

  it("shows open houses with date, time, and remarks", async () => {
    fetchPropertyById.mockResolvedValue(makeProperty());
    fetchOpenHouses.mockResolvedValue([
      {
        id: 1,
        OpenHouseDate: "2026-06-20",
        OH_StartTime: "14:00:00",
        OH_EndTime: "16:00:00",
        all_data: JSON.stringify({
          OpenHouseRemarks: "Enter through side door.",
        }),
      },
    ]);

    renderDetailPage();

    expect(await screen.findByText("2026-06-20")).toBeInTheDocument();
    expect(screen.getByText(/14:00:00/)).toBeInTheDocument();
    expect(screen.getByText("Enter through side door.")).toBeInTheDocument();
  });

  it("shows a message when there are no open houses", async () => {
    fetchPropertyById.mockResolvedValue(makeProperty());
    fetchOpenHouses.mockResolvedValue([]);

    renderDetailPage();

    expect(
      await screen.findByText("No open houses scheduled."),
    ).toBeInTheDocument();
  });

  it("shows an error message when the property fails to load", async () => {
    fetchPropertyById.mockRejectedValue(
      new Error("No property found with id 42"),
    );
    fetchOpenHouses.mockResolvedValue([]);

    renderDetailPage();

    expect(
      await screen.findByText(/No property found with id 42/),
    ).toBeInTheDocument();
  });

  it("has a back link to the listings page", async () => {
    fetchPropertyById.mockResolvedValue(makeProperty());
    fetchOpenHouses.mockResolvedValue([]);

    renderDetailPage();

    const backLink = await screen.findByRole("link", {
      name: /back to listings/i,
    });
    expect(backLink).toHaveAttribute("href", "/");
  });
});

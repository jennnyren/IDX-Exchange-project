import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchProperties } from "./properties";

describe("fetchProperties", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("omits empty/undefined filter values from the query string", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ total: 0, limit: 20, offset: 0, results: [] }),
    });

    await fetchProperties({ city: "Boston", zipcode: "", maxPrice: undefined });

    const calledUrl = fetch.mock.calls[0][0];
    expect(calledUrl).toContain("city=Boston");
    expect(calledUrl).not.toContain("zipcode=");
    expect(calledUrl).not.toContain("maxPrice=");
  });

  it("combines multiple filters into one request", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ total: 0, limit: 20, offset: 0, results: [] }),
    });

    await fetchProperties({ city: "Boston", beds: 3, baths: 2 });

    const calledUrl = fetch.mock.calls[0][0];
    expect(calledUrl).toContain("city=Boston");
    expect(calledUrl).toContain("beds=3");
    expect(calledUrl).toContain("baths=2");
  });

  it("returns parsed JSON when the response is ok", async () => {
    const payload = {
      total: 1,
      limit: 20,
      offset: 0,
      results: [{ L_ListingID: "1" }],
    };
    fetch.mockResolvedValue({ ok: true, json: async () => payload });

    const result = await fetchProperties();

    expect(result).toEqual(payload);
  });

  it("throws using the server's error message when the response is not ok", async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: "minPrice must be a non-negative number" }),
    });

    await expect(fetchProperties({ minPrice: -5 })).rejects.toThrow(
      "minPrice must be a non-negative number",
    );
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

const property = { L_ListingID: "123", L_Address: "1 Main St" };

// The hook's store is a module-level singleton (shared across every
// component instance), so each test re-imports it fresh via resetModules
// to get an isolated store seeded only from localStorage.
async function loadHook() {
  const mod = await import("./useFavorites");
  return mod.useFavorites;
}

beforeEach(() => {
  window.localStorage.clear();
  vi.resetModules();
});

describe("useFavorites", () => {
  it("starts with no favorites", async () => {
    const useFavorites = await loadHook();
    const { result } = renderHook(() => useFavorites());

    expect(result.current.favorites).toEqual([]);
    expect(result.current.count).toBe(0);
    expect(result.current.isFavorite("123")).toBe(false);
  });

  it("adds a property to favorites and persists it to localStorage", async () => {
    const useFavorites = await loadHook();
    const { result } = renderHook(() => useFavorites());

    act(() => result.current.toggleFavorite(property));

    expect(result.current.isFavorite("123")).toBe(true);
    expect(result.current.favorites).toEqual([property]);
    expect(result.current.count).toBe(1);
    expect(
      JSON.parse(window.localStorage.getItem("favoriteProperties")),
    ).toEqual({
      123: property,
    });
  });

  it("removes a property when toggled again", async () => {
    const useFavorites = await loadHook();
    const { result } = renderHook(() => useFavorites());

    act(() => result.current.toggleFavorite(property));
    act(() => result.current.toggleFavorite(property));

    expect(result.current.isFavorite("123")).toBe(false);
    expect(result.current.favorites).toEqual([]);
    expect(result.current.count).toBe(0);
  });

  it("keeps multiple hook instances in sync", async () => {
    const useFavorites = await loadHook();
    const a = renderHook(() => useFavorites());
    const b = renderHook(() => useFavorites());

    act(() => a.result.current.toggleFavorite(property));

    expect(b.result.current.isFavorite("123")).toBe(true);
    expect(b.result.current.count).toBe(1);
  });

  it("loads previously saved favorites from localStorage on a fresh mount", async () => {
    window.localStorage.setItem(
      "favoriteProperties",
      JSON.stringify({ 123: property }),
    );

    const useFavorites = await loadHook();
    const { result } = renderHook(() => useFavorites());

    expect(result.current.isFavorite("123")).toBe(true);
    expect(result.current.favorites).toEqual([property]);
  });
});

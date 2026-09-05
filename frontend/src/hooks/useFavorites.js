import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "favoriteProperties";

function readStore() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

// Module-level store shared by every useFavorites() instance, so favoriting
// from one PropertyCard is immediately reflected everywhere else (e.g. the
// nav bar count) without prop drilling or context.
let store = readStore();
const listeners = new Set();

function setStore(next) {
  store = next;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return store;
}

export function useFavorites() {
  const favoritesMap = useSyncExternalStore(subscribe, getSnapshot);

  const isFavorite = useCallback(
    (id) => Object.hasOwn(favoritesMap, id),
    [favoritesMap],
  );

  const toggleFavorite = useCallback((property) => {
    const id = property.L_ListingID;
    const next = { ...store };
    if (Object.hasOwn(next, id)) {
      delete next[id];
    } else {
      next[id] = property;
    }
    setStore(next);
  }, []);

  return {
    favorites: Object.values(favoritesMap),
    isFavorite,
    toggleFavorite,
    count: Object.keys(favoritesMap).length,
  };
}

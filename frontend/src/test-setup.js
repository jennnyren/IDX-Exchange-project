import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Node's experimental Web Storage global (--webstorage, on by default in
// recent Node versions) installs a non-functional localStorage stub that
// shadows jsdom's own implementation. Replace it with a minimal in-memory
// polyfill so tests that use localStorage behave as expected.
if (typeof globalThis.localStorage?.getItem !== "function") {
  const store = new Map();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key),
      clear: () => store.clear(),
      key: (index) => Array.from(store.keys())[index] ?? null,
      get length() {
        return store.size;
      },
    },
  });
}

afterEach(() => {
  cleanup();
});

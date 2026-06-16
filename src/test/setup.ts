import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom (under Node 26) does not always expose a working Storage, so provide a
// minimal in-memory localStorage. The session store + refresh-token tests depend
// on read/write/clear; this keeps them deterministic across environments.
function installLocalStorage() {
  const store = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (k) => (store.has(k) ? store.get(k)! : null),
    key: (i) => Array.from(store.keys())[i] ?? null,
    removeItem: (k) => void store.delete(k),
    setItem: (k, v) => void store.set(k, String(v)),
  };
  Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true, writable: true });
  if (typeof window !== "undefined") {
    Object.defineProperty(window, "localStorage", { value: storage, configurable: true, writable: true });
  }
}

installLocalStorage();

afterEach(() => {
  cleanup();
  localStorage.clear();
});

beforeEach(() => {
  localStorage.clear();
});

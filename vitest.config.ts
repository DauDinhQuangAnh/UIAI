import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

// Unit/component test runner. jsdom for DOM APIs; the @ alias mirrors vite.config
// so test imports match app imports. The TanStack Router plugin is intentionally
// omitted — tests import components directly, not via the generated route tree.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "jsdom",
    // A concrete origin (not about:blank) so localStorage is available — the session
    // store and refresh-token tests read/write it.
    environmentOptions: { jsdom: { url: "http://localhost" } },
    // openapi-fetch builds a `new Request(baseUrl + path)`; node's Request rejects a
    // relative URL, so give the client an absolute origin in tests (the browser
    // resolves relative same-origin URLs at runtime).
    env: { VITE_API_BASE_URL: "http://localhost" },
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // e2e specs live in web/e2e and run under Playwright, not Vitest.
    exclude: ["e2e/**", "node_modules/**"],
  },
});

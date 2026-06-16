import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";
import { ErrorFallback, NotFound } from "./components/common/error-fallback";
import "./styles/globals.css";

// One QueryClient for the SPA lifetime. Exposed to routes via router context so
// loaders/components share the same cache.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
  scrollRestoration: true,
  // Global boundaries: uncaught render/loader errors and unmatched URLs get a
  // branded full-page fallback instead of a blank screen.
  defaultErrorComponent: ({ reset }) => <ErrorFallback reset={reset} />,
  defaultNotFoundComponent: () => <NotFound />,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element #root not found");

createRoot(rootEl).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);

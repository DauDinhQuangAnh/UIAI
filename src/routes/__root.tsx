import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

export interface RouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      {/* aria-live polite, auto-dismiss, never steals focus (design §5). */}
      <Toaster position="bottom-right" richColors closeButton toastOptions={{ duration: 4000 }} />
    </QueryClientProvider>
  );
}

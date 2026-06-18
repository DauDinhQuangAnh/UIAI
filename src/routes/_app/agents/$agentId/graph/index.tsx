import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Code-split the graph view so React Flow + dagre (~100–150KB gzip) only load when the Graph
// tab is opened, keeping them out of the main chunk.
const KgGraph = lazy(() => import("@/components/knowledge/kg-graph"));

export const Route = createFileRoute("/_app/agents/$agentId/graph/")({
  component: GraphScreen,
});

function GraphScreen() {
  const { agentId } = Route.useParams();
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-6 sm:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-semibold text-text-primary">Graph</h1>
        <p className="text-sm text-text-secondary">
          Knowledge Graph của Agent, gồm các thực thể và quan hệ được trích xuất từ Documents.
        </p>
      </div>
      <Suspense fallback={<Skeleton className="h-[calc(100dvh-7rem)] w-full rounded-2xl" />}>
        <KgGraph agentId={agentId} />
      </Suspense>
    </div>
  );
}

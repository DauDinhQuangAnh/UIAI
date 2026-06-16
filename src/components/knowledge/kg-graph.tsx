import { useMemo, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  type Node,
  type Edge,
} from "@xyflow/react";
import dagre from "dagre";
import "@xyflow/react/dist/style.css";
import { Warning, X, Graph as GraphIcon } from "@phosphor-icons/react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { useKgGraph, type KGGraph } from "@/api/hooks/knowledge";

// Node box size fed to dagre and used to convert dagre's center coords → React Flow's
// top-left origin. Kept in sync with the rendered node padding/width.
const NODE_W = 168;
const NODE_H = 44;

// Entity-type → token-based color triple (no raw hex; every value is a design-system CSS var).
// A stable hash maps each type onto one palette slot, so the same type is always the same color
// within a graph. Collisions are acceptable for <150 nodes.
const TYPE_PALETTE = [
  { bg: "var(--brand-50)", border: "var(--brand-400)", text: "var(--brand-800)" },
  { bg: "var(--info-bg)", border: "var(--info-border)", text: "var(--info-fg)" },
  { bg: "var(--success-bg)", border: "var(--success-border)", text: "var(--success-fg)" },
  { bg: "var(--warning-bg)", border: "var(--warning-border)", text: "var(--warning-fg)" },
  { bg: "var(--danger-bg)", border: "var(--danger-border)", text: "var(--danger-fg)" },
  { bg: "var(--surface-2)", border: "var(--border-strong)", text: "var(--text)" },
];

function colorForType(type: string) {
  let h = 0;
  for (let i = 0; i < type.length; i++) h = (h * 31 + type.charCodeAt(i)) >>> 0;
  return TYPE_PALETTE[h % TYPE_PALETTE.length];
}

// laidOut runs a dagre layout once per data load (memoized on the graph identity), assigning a
// position to every node — including disconnected ones, which dagre still places on the grid.
function laidOut(data: KGGraph): { nodes: Node[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: "LR", nodesep: 40, ranksep: 80 });
  g.setDefaultEdgeLabel(() => ({}));

  const rawNodes = data.nodes ?? [];
  const rawEdges = data.edges ?? [];
  for (const n of rawNodes) g.setNode(n.id!, { width: NODE_W, height: NODE_H });
  for (const e of rawEdges) g.setEdge(e.source!, e.target!);
  dagre.layout(g);

  const nodes: Node[] = rawNodes.map((n) => {
    const pos = g.node(n.id!);
    const c = colorForType(n.entity_type ?? "");
    return {
      id: n.id!,
      position: { x: (pos?.x ?? 0) - NODE_W / 2, y: (pos?.y ?? 0) - NODE_H / 2 },
      data: { label: n.name ?? "(unnamed)" },
      style: {
        width: NODE_W,
        background: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
        borderRadius: 10,
        fontSize: 12,
        padding: "6px 10px",
      },
    };
  });

  const edges: Edge[] = rawEdges.map((e) => ({
    id: e.id!,
    source: e.source!,
    target: e.target!,
    label: e.relation_type,
    labelStyle: { fontSize: 10, fill: "var(--text-secondary)" },
    style: { stroke: "var(--border-strong)" },
  }));

  return { nodes, edges };
}

// KgGraph is the interactive Graph tab: it fetches the read-only KG endpoint and renders it as
// a pan/zoomable React Flow canvas (dagre layout, type-colored nodes, relation-labeled edges).
// Clicking a node opens an inspector panel; a banner appears when the backend truncated to 150.
export function KgGraph({ agentId }: { agentId: string }) {
  const query = useKgGraph(agentId);
  const data = query.data;

  const { nodes, edges } = useMemo(() => (data ? laidOut(data) : { nodes: [], edges: [] }), [data]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = (data?.nodes ?? []).find((n) => n.id === selectedId) ?? null;

  if (query.isLoading) {
    return <Skeleton className="h-[calc(100dvh-7rem)] w-full rounded-2xl" />;
  }
  if (query.isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-surface px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-pill bg-danger-bg text-danger-fg">
          <Warning className="size-6" aria-hidden />
        </span>
        <p className="text-sm text-text-secondary">Couldn't load the graph.</p>
        <button className="text-sm font-medium text-brand-700" onClick={() => query.refetch()}>
          Retry
        </button>
      </div>
    );
  }
  if (nodes.length === 0) {
    return (
      <EmptyState
        icon={GraphIcon}
        title="No graph yet"
        description="Enable KG grounding for this agent and ingest a document to populate the graph. Enabling only affects newly ingested documents."
      />
    );
  }

  return (
    <div className="relative h-[calc(100dvh-7rem)] w-full overflow-hidden rounded-2xl border border-border bg-surface">
      {data?.truncated && (
        <div className="absolute left-3 top-3 z-10 rounded-pill border border-warning-border bg-warning-bg px-3 py-1 text-xs font-medium text-warning-fg">
          Showing top {nodes.length} of {data.total_entities} entities (by confidence)
        </div>
      )}
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          fitView
          minZoom={0.1}
          onNodeClick={(_e, n) => setSelectedId(n.id)}
          onPaneClick={() => setSelectedId(null)}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="var(--border)" gap={20} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </ReactFlowProvider>

      {selected && (
        <aside className="absolute right-3 top-3 z-10 flex w-72 flex-col gap-2 rounded-xl border border-border bg-surface p-4 shadow-md">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-base font-semibold text-text-primary">{selected.name}</h3>
            <button aria-label="Close" onClick={() => setSelectedId(null)} className="text-text-dim hover:text-text-primary">
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <span className="w-fit rounded-pill bg-surface-2 px-2 py-0.5 font-mono text-xs text-text-secondary">
            {selected.entity_type}
          </span>
          {selected.description && <p className="text-sm text-text-secondary">{selected.description}</p>}
          <p className="text-xs text-text-dim">Confidence: {((selected.confidence ?? 0) * 100).toFixed(0)}%</p>
        </aside>
      )}
    </div>
  );
}

export default KgGraph;

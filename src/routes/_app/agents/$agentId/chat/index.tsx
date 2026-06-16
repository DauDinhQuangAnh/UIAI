import { createFileRoute } from "@tanstack/react-router";
import { ChatPanel } from "@/components/chat/chat-panel";

export const Route = createFileRoute("/_app/agents/$agentId/chat/")({
  component: ChatScreen,
});

function ChatScreen() {
  const { agentId } = Route.useParams();
  // Constrain to the viewport minus the 3.5rem topbar so the panel owns a bounded column:
  // header + composer pin while the thread scrolls between them.
  return (
    <div className="mx-auto h-[calc(100dvh-3.5rem)] w-full max-w-4xl">
      <ChatPanel agentId={agentId} />
    </div>
  );
}

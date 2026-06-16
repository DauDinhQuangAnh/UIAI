import { describe, it, expect, vi, afterEach } from "vitest";
import { sendChatMessage, type ChatDoneEvent } from "./chat";

// streamResponse builds a Response whose body streams the given chunks (each chunk a string),
// so the SSE reader's partial-frame buffering across read boundaries is exercised.
function streamResponse(chunks: string[], init: ResponseInit = { status: 200 }): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(encoder.encode(c));
      controller.close();
    },
  });
  return new Response(body, { status: 200, ...init });
}

function collect() {
  const deltas: string[] = [];
  let done: ChatDoneEvent | undefined;
  let error: { code: string; message: string } | undefined;
  return {
    deltas,
    get done() {
      return done;
    },
    get error() {
      return error;
    },
    handlers: {
      onDelta: (t: string) => deltas.push(t),
      onDone: (d: ChatDoneEvent) => (done = d),
      onError: (e: { code: string; message: string }) => (error = e),
    },
  };
}

afterEach(() => vi.restoreAllMocks());

describe("sendChatMessage SSE reader", () => {
  it("emits deltas in order then done, even with frames split across reads", async () => {
    // The `done` frame is deliberately split mid-frame across two chunks.
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      streamResponse([
        "event: delta\ndata: {\"text\":\"Hel\"}\n\n",
        "event: delta\ndata: {\"text\":\"lo\"}\n\nevent: do",
        'ne\ndata: {"finish_reason":"STOP","message_id":"m1"}\n\n',
      ]),
    );
    const c = collect();
    await sendChatMessage("agent-1", "hi", c.handlers);

    expect(c.deltas.join("")).toBe("Hello");
    expect(c.done?.message_id).toBe("m1");
    expect(c.error).toBeUndefined();
  });

  it("treats a stream that ends without done as a failure", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      streamResponse(["event: delta\ndata: {\"text\":\"partial\"}\n\n"]),
    );
    const c = collect();
    await sendChatMessage("agent-1", "hi", c.handlers);

    expect(c.deltas.join("")).toBe("partial");
    expect(c.done).toBeUndefined();
    expect(c.error?.code).toBe("incomplete");
  });

  it("surfaces an explicit error frame and stops", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      streamResponse(['event: error\ndata: {"code":"no_reply","message":"blocked"}\n\n']),
    );
    const c = collect();
    await sendChatMessage("agent-1", "hi", c.handlers);

    expect(c.error?.code).toBe("no_reply");
    expect(c.done).toBeUndefined();
  });

  it("maps a 503 to a provider_unavailable error without reading a body", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 503 }));
    const c = collect();
    await sendChatMessage("agent-1", "hi", c.handlers);

    expect(c.error?.code).toBe("provider_unavailable");
  });

  it("ignores an aborted request silently", async () => {
    const abortErr = new DOMException("aborted", "AbortError");
    vi.spyOn(globalThis, "fetch").mockRejectedValue(abortErr);
    const c = collect();
    await sendChatMessage("agent-1", "hi", c.handlers);

    expect(c.error).toBeUndefined();
    expect(c.done).toBeUndefined();
  });
});

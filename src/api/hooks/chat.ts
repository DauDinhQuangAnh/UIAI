import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../client";
import { unwrap } from "../errors";
import { API_BASE_URL } from "../config";
import { useSession } from "@/auth/session-store";
import type { components } from "../schema";

export type ChatSession = components["schemas"]["ChatSession"];
export type Message = components["schemas"]["Message"];

export const chatKeys = {
  session: (agentId: string) => ["agents", agentId, "chat", "session"] as const,
};

// useChatSession loads the operator's current open playground session (the API auto-creates
// one on first access) plus its prior scratch messages. Not refetched on focus — the live
// thread is owned by local state once streaming starts.
export function useChatSession(agentId: string) {
  return useQuery({
    queryKey: chatKeys.session(agentId),
    queryFn: async () =>
      unwrap(await apiClient.GET("/api/agents/{id}/chat", { params: { path: { id: agentId } } })) as ChatSession,
    refetchOnWindowFocus: false,
  });
}

// useResetChat closes the current session and opens a fresh one, then primes the session
// cache with the empty session so the thread clears immediately.
export function useResetChat(agentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () =>
      unwrap(await apiClient.POST("/api/agents/{id}/chat/reset", { params: { path: { id: agentId } } })) as ChatSession,
    onSuccess: (session) => {
      qc.setQueryData(chatKeys.session(agentId), session);
    },
  });
}

export interface ChatDoneEvent {
  usage?: { input_tokens?: number; output_tokens?: number };
  finish_reason?: string;
  message_id?: string;
}

export interface SendChatHandlers {
  onDelta: (text: string) => void;
  onDone: (done: ChatDoneEvent) => void;
  onError: (err: { code: string; message: string }) => void;
  signal?: AbortSignal;
}

// ProviderUnavailableError code surfaced when the send endpoint 503s (no Gemini key).
const PROVIDER_UNAVAILABLE = "provider_unavailable";

// sendChatMessage POSTs a message and reads the Server-Sent Events reply stream. openapi-fetch
// can't consume SSE, so this is a hand-rolled fetch + ReadableStream reader. The access token
// is attached as a Bearer header (the API has no cookie JWT path); a 401 mid-flight surfaces as
// an auth error the caller can retry. A stream that ends WITHOUT a `done` event is treated as a
// failure (onError), so a truncated reply is never presented as complete.
export async function sendChatMessage(agentId: string, text: string, handlers: SendChatHandlers): Promise<void> {
  const token = useSession.getState().accessToken;
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/agents/${agentId}/chat/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ text }),
      credentials: "include",
      signal: handlers.signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") return;
    handlers.onError({ code: "network_error", message: "could not reach the server" });
    return;
  }

  if (res.status === 503) {
    handlers.onError({ code: PROVIDER_UNAVAILABLE, message: "Chat needs a configured Gemini key" });
    return;
  }
  if (res.status === 401) {
    handlers.onError({ code: "unauthorized", message: "your session expired — please retry" });
    return;
  }
  if (!res.ok || !res.body) {
    handlers.onError({ code: "request_failed", message: `request failed (${res.status})` });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let sawDone = false;

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      // SSE frames are separated by a blank line. Keep the trailing partial in the buffer.
      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        const evt = parseFrame(frame);
        if (!evt) continue;
        if (evt.event === "delta") {
          handlers.onDelta(evt.data?.text ?? "");
        } else if (evt.event === "done") {
          sawDone = true;
          handlers.onDone(evt.data as ChatDoneEvent);
        } else if (evt.event === "error") {
          handlers.onError({ code: evt.data?.code ?? "stream_error", message: evt.data?.message ?? "the reply failed" });
          return;
        }
      }
    }
  } catch (err) {
    if ((err as Error).name === "AbortError") return;
    handlers.onError({ code: "stream_error", message: "the reply stream was interrupted" });
    return;
  }

  // A stream that ended without a terminal `done` frame is a failed turn.
  if (!sawDone) {
    handlers.onError({ code: "incomplete", message: "the reply ended unexpectedly" });
  }
}

interface ParsedFrame {
  event: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

// parseFrame turns one raw SSE frame (`event: X\ndata: {...}`) into {event, data}. Lines that
// aren't event/data are ignored; a malformed data payload yields null so the stream continues.
function parseFrame(frame: string): ParsedFrame | null {
  let event = "message";
  let dataRaw = "";
  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) dataRaw += line.slice(5).trim();
  }
  if (!dataRaw) return null;
  try {
    return { event, data: JSON.parse(dataRaw) };
  } catch {
    return null;
  }
}

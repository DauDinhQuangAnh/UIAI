import type { Page, Route } from "@playwright/test";

// Stateful in-memory backend mock driven entirely at the network layer, so the
// happy-path e2e is deterministic and needs no real API. Document ingest advances
// queued -> extracting -> ready across successive status polls.
//
// Auth is cookie-based: login/refresh return NO body token and instead set an
// HttpOnly refresh_token cookie (Path=/api/auth) via Set-Cookie. refresh reads the
// presented cookie and enforces rotation+reuse-detection — presenting a stale
// (already-rotated) token 401s and clears the cookie, exactly like the real server.
export interface MockState {
  agents: Record<string, unknown>[];
  docStatusPolls: number;
  candidates: Record<string, unknown>[];
  // The single currently-valid refresh token value. Rotated on each refresh; a
  // request presenting anything else is treated as reuse → 401 (family revoked).
  validToken: string | null;
  rotations: number;
  // Chat playground: the current scratch session id + its persisted messages. Reset rotates
  // the id and clears the thread; a sent message replays a canned SSE reply.
  chatSessionId: string;
  chatMessages: Record<string, unknown>[];
}

const AGENT = {
  id: "agent-1",
  agent_ref: "acme-support",
  display_name: "Acme Support",
  status: "active",
  created_at: "2026-06-01T00:00:00Z",
  retrieval_config: { top_k: 5, vector_weight: 0.5, fts_weight: 0.5 },
  kg_enabled: false,
};

const COOKIE_PATH = "Path=/api/auth; HttpOnly; SameSite=Strict";

function json(route: Route, status: number, body: unknown, headers?: Record<string, string>) {
  return route.fulfill({
    status,
    contentType: "application/json",
    headers,
    body: JSON.stringify(body),
  });
}

// Extract the refresh_token value from a request's Cookie header (HttpOnly cookies are
// still sent by the browser even though JS can't read them).
function presentedToken(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === "refresh_token") return v.join("=");
  }
  return null;
}

export function makeMockState(): MockState {
  return {
    agents: [],
    docStatusPolls: 0,
    candidates: [
      {
        id: "cand-1",
        agent_id: "agent-1",
        entity_a_id: "ENTITY_A",
        entity_b_id: "ENTITY_B",
        similarity: 0.92,
        status: "pending",
      },
    ],
    validToken: null,
    rotations: 0,
    chatSessionId: "chat-1",
    chatMessages: [],
  };
}

// chatSessionBody builds the GET/reset response: the open session + its thread.
function chatSessionBody(state: MockState) {
  return {
    conversation: {
      id: state.chatSessionId,
      conversation_ref: `dash:u:${state.chatSessionId}`,
      end_user_ref: "u",
      status: "active",
      last_activity_at: "2026-06-12T00:00:00Z",
      created_at: "2026-06-12T00:00:00Z",
    },
    messages: state.chatMessages,
  };
}

// installMockApi attaches the network mock to a page. Pass a shared state to back
// multiple pages (tabs) with one backend — required by the multi-tab cookie/lock spec.
export async function installMockApi(page: Page, state: MockState = makeMockState()): Promise<MockState> {
  // Match only origin-rooted "/api/..." calls — NOT Vite's "/src/api/*.ts" source
  // modules in dev (a "**/api/**" glob would 404 the app's own code and blank it).
  await page.route(/^https?:\/\/[^/]+\/api\//, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname;
    const method = req.method();

    // --- Auth (cookie transport) ---
    if (path === "/api/auth/login" && method === "POST") {
      state.validToken = "refresh-1";
      state.rotations = 1;
      return json(route, 200, { access_token: "access-jwt" }, {
        "set-cookie": `refresh_token=${state.validToken}; ${COOKIE_PATH}`,
      });
    }
    if (path === "/api/auth/refresh" && method === "POST") {
      const presented = presentedToken(req.headers()["cookie"]);
      // Reuse-detection: only the current token rotates; a missing/stale one is a
      // family-revoke 401 that also evicts the dead cookie.
      if (!presented || presented !== state.validToken) {
        return json(route, 401, { error: { code: "unauthorized" } }, {
          "set-cookie": `refresh_token=; ${COOKIE_PATH}; Max-Age=0`,
        });
      }
      state.rotations += 1;
      state.validToken = `refresh-${state.rotations}`;
      return json(route, 200, { access_token: "access-jwt" }, {
        "set-cookie": `refresh_token=${state.validToken}; ${COOKIE_PATH}`,
      });
    }
    if (path === "/api/auth/me" && method === "GET") {
      return json(route, 200, { email: "admin@acme.test", display_name: "Acme Admin", role: "admin" });
    }
    if (path === "/api/auth/logout") {
      state.validToken = null;
      return route.fulfill({
        status: 204,
        headers: { "set-cookie": `refresh_token=; ${COOKIE_PATH}; Max-Age=0` },
        body: "",
      });
    }

    // --- Agents ---
    if (path === "/api/agents" && method === "GET") {
      return json(route, 200, { agents: state.agents, next_cursor: {} });
    }
    if (path === "/api/agents" && method === "POST") {
      state.agents = [AGENT];
      return json(route, 200, AGENT);
    }
    if (path === "/api/agents/agent-1" && method === "GET") return json(route, 200, AGENT);
    if (path === "/api/agents/agent-1/stats") {
      return json(route, 200, {
        documents_by_status: { ready: 1 },
        conversations: 0,
        messages_30d: 0,
        kg_entities: 4,
        kg_relations: 2,
        pending_dedup: state.candidates.filter((c) => c.status === "pending").length,
      });
    }

    // --- Documents (async ingest) ---
    if (path === "/api/agents/agent-1/documents" && method === "GET") {
      const docs = state.docStatusPolls > 0 ? [docRow(state)] : [];
      return json(route, 200, { documents: docs, next_cursor: {} });
    }
    if (path === "/api/agents/agent-1/documents" && method === "POST") {
      state.docStatusPolls = 1;
      return json(route, 202, { document_id: "doc-1", status: "queued" });
    }
    if (path === "/api/agents/agent-1/documents/doc-1" && method === "GET") {
      state.docStatusPolls += 1;
      return json(route, 200, docRow(state));
    }

    // --- KG candidates ---
    if (path === "/api/agents/agent-1/kg/candidates") {
      const status = url.searchParams.get("status") ?? "pending";
      return json(route, 200, {
        candidates: state.candidates.filter((c) => c.status === status),
        next_cursor: {},
      });
    }
    if (path === "/api/kg/candidates/cand-1/merge" && method === "POST") {
      state.candidates = state.candidates.map((c) => (c.id === "cand-1" ? { ...c, status: "merged" } : c));
      return json(route, 200, { ...state.candidates[0] });
    }

    // --- Conversations ---
    if (path === "/api/agents/agent-1/conversations") {
      return json(route, 200, { conversations: [], next_cursor: {} });
    }

    // --- Chat playground ---
    if (path === "/api/agents/agent-1/chat" && method === "GET") {
      return json(route, 200, chatSessionBody(state));
    }
    if (path === "/api/agents/agent-1/chat/reset" && method === "POST") {
      state.chatSessionId = "chat-2";
      state.chatMessages = [];
      return json(route, 200, chatSessionBody(state));
    }
    if (path === "/api/agents/agent-1/chat/messages" && method === "POST") {
      // Canned SSE reply: two deltas then a terminal done. Fulfilled in one body — the
      // browser's fetch still exposes it as a readable stream the SSE reader parses.
      const sse =
        'event: delta\ndata: {"text":"Hello"}\n\n' +
        'event: delta\ndata: {"text":" from the agent"}\n\n' +
        'event: done\ndata: {"finish_reason":"STOP","message_id":"m-1"}\n\n';
      return route.fulfill({ status: 200, contentType: "text/event-stream", body: sse });
    }

    return json(route, 404, { error: { code: "not_found", message: path } });
  });

  return state;
}

// The polled document: third poll onward reports the terminal "ready" status.
function docRow(state: MockState) {
  const status = state.docStatusPolls >= 3 ? "ready" : "extracting";
  return {
    id: "doc-1",
    agent_id: "agent-1",
    title: "handbook.pdf",
    format: "pdf",
    status,
    created_at: "2026-06-12T00:00:00Z",
  };
}

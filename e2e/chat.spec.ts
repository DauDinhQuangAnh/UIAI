import { test, expect } from "@playwright/test";
import { installMockApi } from "./mock-api";

// Happy-path for the chat playground against the mocked API: sign in, open an agent's Chat
// tab, send a message, see the streamed reply render, then Reset back to an empty thread.
test("chat playground: send → streamed reply → reset", async ({ page }) => {
  const state = await installMockApi(page);
  // An agent must exist for the sidebar Chat link to resolve.
  state.agents = [
    {
      id: "agent-1",
      agent_ref: "acme-support",
      display_name: "Acme Support",
      status: "active",
      created_at: "2026-06-01T00:00:00Z",
      retrieval_config: {},
      kg_enabled: false,
    },
  ];

  // --- Sign in ---
  await page.goto("/login");
  await page.getByLabel("Workspace").fill("acme-support");
  await page.getByLabel("Email").fill("admin@acme.test");
  await page.getByLabel("Password").fill("correct-horse");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/agents$/);

  // --- Open the agent's Chat tab ---
  await page.goto("/agents/agent-1/chat");
  await expect(page.getByText("Playground")).toBeVisible();
  await expect(page.getByText("Send a message to try this agent")).toBeVisible();

  // --- Send a message; the streamed reply renders ---
  await page.getByRole("textbox", { name: "Message" }).fill("hello there");
  await page.keyboard.press("Enter");
  await expect(page.getByText("hello there")).toBeVisible(); // optimistic user bubble
  await expect(page.getByText("Hello from the agent")).toBeVisible(); // streamed assistant reply

  // --- Reset clears the thread back to the empty state ---
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByText("Send a message to try this agent")).toBeVisible();
  await expect(page.getByText("Hello from the agent")).toBeHidden();
});

import type { AgentTool } from "./tools";

/**
 * The slice of WebMCP this client uses: `document.modelContext` from Chrome
 * 150 (navigator.modelContext is deprecated and deliberately never read), and
 * registration bound to an AbortSignal, which is how a tool is withdrawn.
 */
export interface ModelContextLike {
  registerTool(
    tool: {
      name: string;
      description: string;
      inputSchema: unknown;
      annotations: Readonly<Record<string, boolean>>;
      execute: (input: unknown, options?: { signal?: AbortSignal }) => unknown;
    },
    options?: { signal?: AbortSignal },
  ): unknown;
}

/** Null on any browser that does not offer the API; the caller then does nothing at all. */
export function modelContextOf(host: unknown): ModelContextLike | null {
  if (typeof host !== "object" || host === null) return null;
  const candidate = (host as { modelContext?: unknown }).modelContext;
  if (typeof candidate !== "object" || candidate === null) return null;
  const register = (candidate as { registerTool?: unknown }).registerTool;
  return typeof register === "function"
    ? (candidate as ModelContextLike)
    : null;
}

export type CallReport = (name: string) => (ok: boolean) => void;

/**
 * Register every tool, each one read-only and carrying message text an agent
 * must treat as untrusted (the words are whoever wrote them). The returned
 * function withdraws all of them.
 */
export async function registerAgentTools(
  context: ModelContextLike,
  tools: readonly AgentTool[],
  report: CallReport,
): Promise<() => void> {
  const controller = new AbortController();
  for (const tool of tools) {
    await context.registerTool(
      {
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations: {
          readOnlyHint: true,
          untrustedContentHint: true,
          consequentialHint: false,
        },
        execute: async (input, options) => {
          const finished = report(tool.name);
          try {
            const answer = await tool.run(
              input,
              options?.signal ?? controller.signal,
            );
            finished(answer.ok !== false);
            return JSON.stringify(answer);
          } catch (error) {
            finished(false);
            throw error;
          }
        },
      },
      { signal: controller.signal },
    );
  }
  return () => controller.abort();
}

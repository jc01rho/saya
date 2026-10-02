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

function withdrawn(): DOMException {
  return new DOMException("The agent tools were turned off", "AbortError");
}

/**
 * Register every tool, each one read-only and carrying message text an agent
 * must treat as untrusted (the words are whoever wrote them). Aborting
 * `withdraw` removes every tool registered so far, stops the rest from being
 * registered, cancels reads in flight and refuses their answers; the caller
 * owns it before the first registration starts, so turning off never waits on
 * the browser.
 */
export async function registerAgentTools(
  context: ModelContextLike,
  tools: readonly AgentTool[],
  report: CallReport,
  withdraw: AbortSignal,
): Promise<void> {
  for (const tool of tools) {
    if (withdraw.aborted) return;
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
          if (withdraw.aborted) throw withdrawn();
          const finished = report(tool.name);
          try {
            const answer = await tool.run(
              input,
              options?.signal
                ? AbortSignal.any([withdraw, options.signal])
                : withdraw,
            );
            // Turned off while reading: the answer is not handed over.
            if (withdraw.aborted) throw withdrawn();
            finished(answer.ok !== false);
            return JSON.stringify(answer);
          } catch (error) {
            finished(false);
            throw error;
          }
        },
      },
      { signal: withdraw },
    );
  }
}

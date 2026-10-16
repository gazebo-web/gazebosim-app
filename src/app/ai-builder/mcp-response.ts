/**
 * Shared helpers for interpreting a JSON-RPC response from fuel-server's
 * `/1.0/mcp` endpoint. Mirrors the Go `remote.Server.Call` unwrap logic
 * (ai-builder-service `internal/mcp/remote/server.go`) so TypeScript
 * callers and the Go chat engine agree on semantics.
 *
 * Scope: the happy-path "one inline JSON-RPC response, content is a
 * single text block" path that every current MCP tool follows. SSE-
 * streamed results belong in a different helper (see journal Q-MCP-12).
 */

export interface MCPContentBlock {
  type: string;
  text?: string;
}

export interface MCPToolResult {
  content?: MCPContentBlock[];
  isError?: boolean;
}

export interface MCPRPCError {
  code: number;
  message: string;
  data?: unknown;
}

export interface MCPRPCEnvelope {
  jsonrpc: "2.0";
  id?: unknown;
  result?: MCPToolResult;
  error?: MCPRPCError;
}

/**
 * unwrapToolResult drills into a JSON-RPC envelope and returns the tool's
 * payload. The rules match the Go side:
 *
 *   - envelope.error  → throw (transport / protocol failure)
 *   - result.isError  → throw (tool-level failure; caller may catch)
 *   - single text block whose body is JSON → parse to object/array
 *   - single text block, non-JSON         → return the raw string
 *   - multiple / non-text blocks          → return the array of text bodies
 *   - empty                               → return undefined
 *
 * `toolName` is only used to produce useful error messages.
 */
export function unwrapToolResult<T = unknown>(
  env: MCPRPCEnvelope,
  toolName: string,
): T | undefined {
  if (env.error) {
    throw new Error(`MCP ${toolName}: ${env.error.message}`);
  }
  const result = env.result;
  if (!result) {
    return undefined;
  }
  if (result.isError) {
    const msg = (result.content ?? [])
      .map((b) => b.text ?? "")
      .filter(Boolean)
      .join("\n");
    throw new Error(`MCP ${toolName}: ${msg || "tool-level error"}`);
  }
  const blocks = result.content ?? [];
  if (blocks.length === 0) {
    return undefined;
  }
  if (blocks.length === 1 && blocks[0].type === "text") {
    const raw = blocks[0].text ?? "";
    const trimmed = raw.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return JSON.parse(trimmed) as T;
      } catch {
        /* fall through to raw text */
      }
    }
    return raw as unknown as T;
  }
  return blocks
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "") as unknown as T;
}

/**
 * buildCallToolRequest assembles the JSON-RPC body for a tools/call
 * invocation. Kept here so callers don't sprinkle hand-written JSON-RPC
 * shapes across the codebase.
 */
export function buildCallToolRequest(
  name: string,
  args: Record<string, unknown> = {},
) {
  return {
    jsonrpc: "2.0" as const,
    id: Date.now(),
    method: "tools/call",
    params: { name, arguments: args },
  };
}

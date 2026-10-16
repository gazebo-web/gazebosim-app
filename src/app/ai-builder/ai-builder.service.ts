import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, catchError, map, of } from "rxjs";

import { environment } from "../../environments/environment";
import {
  buildCallToolRequest,
  MCPRPCEnvelope,
  unwrapToolResult,
} from "./mcp-response";

/**
 * AiBuilderProject mirrors the fuel-server Project resource. The
 * identifier used in URLs is `name` — fuel-server projects don't expose
 * a numeric id, and `name` is unique per owner. Legacy code in this
 * frontend treated `id` as the opaque key; we keep that field here and
 * set it equal to `name` so existing components keep working while we
 * migrate call sites incrementally.
 */
export interface AiBuilderProject {
  id: string; // alias for name; populated client-side
  name: string;
  owner: string;
  description?: string;
  gazebo_version?: string;
  sdf_version?: string;
  ros2_distro?: string;
  github_repo?: string;
  gazebo_ws_url?: string;
  gazebo_ws_key?: string;
  created_at: string;
  updated_at: string;
}

/**
 * ProjectVersion mirrors fuel-server's git-log entry for a project.
 * The `world_sdf` field is no longer carried with the version listing
 * (fuel-server serves SDF content via /projects/{name}/{version}/files);
 * callers that need the body should fetch it explicitly.
 */
export interface ProjectVersion {
  version: number;
  commit_hash: string;
  commit_message: string;
  author: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: string;
  content: string;
  tool_name?: string;
  tool_id?: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  project_id: string;
  messages: ChatMessage[];
  created_at: string;
}

export interface LLMKey {
  user_id: string;
  provider: string;
  api_key_masked?: string;
  endpoint?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LLMKeyInput {
  provider: string;
  api_key?: string;
  endpoint?: string;
}

export interface ModelInfo {
  id: string;
  display_name: string;
}

export interface ChatEvent {
  type: "text" | "tool_call" | "tool_result" | "sdf_update" | "done" | "error";
  text?: string;
  tool?: string;
  tool_call_id?: string;
  input?: unknown;
  result?: unknown;
  sdf?: string;
  error?: string;
}

export interface ExecutionEvent {
  type: "stdout" | "stderr" | "status";
  line?: string;
  status?: "started" | "exited" | "error";
  code?: number;
  error?: string;
  time: string;
}

/**
 * Client for the AI Builder frontend.
 *
 * Two backends are involved:
 *   - fuel-server (API_HOST/1.0) — authoritative for projects, versions,
 *     MCP tool invocation, personal access tokens, and publish.
 *   - ai-builder-service (AI_BUILDER_HOST/1.0/ai-builder) — chat engine,
 *     chat history, LLM key vault, code execution, provider/model listing.
 *
 * Projects are identified in fuel-server URLs by `name` (unique per
 * owner), not by a numeric id. The legacy frontend used `id` as the
 * opaque key; we keep that alias populated so existing components don't
 * need to change on day one.
 */
@Injectable({ providedIn: "root" })
export class AiBuilderService {
  private readonly aiBase =
    environment.AI_BUILDER_HOST || "http://localhost:8010";
  private readonly apiBase = `${this.aiBase}/1.0/ai-builder`;

  private readonly fuelBase = `${environment.API_HOST}/${environment.API_VERSION}`;
  private readonly fuelProjects = `${this.fuelBase}/projects`;

  constructor(private http: HttpClient) {}

  // --- Projects (fuel-server) ---

  createProject(body: Partial<AiBuilderProject>): Observable<AiBuilderProject> {
    return this.http
      .post<AiBuilderProject>(this.fuelProjects, body)
      .pipe(map((p) => this.hydrateProject(p)));
  }

  listProjects(): Observable<AiBuilderProject[]> {
    return this.http
      .get<AiBuilderProject[] | null>(this.fuelProjects)
      .pipe(map((list) => (list ?? []).map((p) => this.hydrateProject(p))));
  }

  getProject(nameOrId: string): Observable<AiBuilderProject> {
    return this.http
      .get<AiBuilderProject>(
        `${this.fuelProjects}/${encodeURIComponent(nameOrId)}`,
      )
      .pipe(map((p) => this.hydrateProject(p)));
  }

  updateProject(
    nameOrId: string,
    body: Partial<AiBuilderProject>,
  ): Observable<AiBuilderProject> {
    return this.http
      .patch<AiBuilderProject>(
        `${this.fuelProjects}/${encodeURIComponent(nameOrId)}`,
        body,
      )
      .pipe(map((p) => this.hydrateProject(p)));
  }

  deleteProject(nameOrId: string): Observable<unknown> {
    return this.http.delete(
      `${this.fuelProjects}/${encodeURIComponent(nameOrId)}`,
    );
  }

  // --- Versions (fuel-server) ---

  listVersions(nameOrId: string): Observable<ProjectVersion[]> {
    return this.http
      .get<
        ProjectVersion[] | null
      >(`${this.fuelProjects}/${encodeURIComponent(nameOrId)}/versions`)
      .pipe(map((list) => list ?? []));
  }

  /**
   * Download a file from a project's git repo at a given version.
   * Returns the raw body as text. `version` accepts "tip" or a numeric
   * string ("1", "2", ...).
   */
  getProjectFile(
    nameOrId: string,
    version: string,
    path: string,
  ): Observable<string> {
    const url = `${this.fuelProjects}/${encodeURIComponent(nameOrId)}/${encodeURIComponent(
      version,
    )}/files/${path
      .split("/")
      .map((p) => encodeURIComponent(p))
      .join("/")}`;
    return this.http.get(url, { responseType: "text" });
  }

  private hydrateProject(p: AiBuilderProject): AiBuilderProject {
    // fuel-server identifies projects by name; populate the legacy `id`
    // alias so consumers that still reference `.id` keep working.
    return { ...p, id: p.id || p.name };
  }

  // --- MCP bridge (fuel-server) ---

  /**
   * callMCPTool dispatches one MCP tool call to fuel-server's
   * /1.0/mcp endpoint. The auth interceptor forwards the Auth0 JWT the
   * user already carries, so the caller just passes the tool name and
   * arguments. Delegates response parsing to the shared `mcp-response`
   * helper so the Go remote-client and this caller agree on semantics.
   */
  callMCPTool<T = unknown>(
    name: string,
    args: Record<string, unknown> = {},
  ): Observable<T> {
    const url = `${this.fuelBase}/mcp`;
    return this.http
      .post<MCPRPCEnvelope>(url, buildCallToolRequest(name, args))
      .pipe(map((env) => unwrapToolResult<T>(env, name) as T));
  }

  /**
   * Save a project's world SDF as a labeled commit via the
   * project.save_world_sdf MCP tool. By default passes
   * `squash_autosaves: true` — the manual Save button is the user
   * saying "this is the canonical state", so the server collapses any
   * preceding run of chat-engine auto-saves into this one labeled
   * snapshot (journal Q-MCP-14). Auto-saves from the chat engine use
   * the tool directly with squash_autosaves=false.
   */
  saveProjectWorld(
    nameOrId: string,
    sdf: string,
    commitMessage: string,
    opts: { squashAutoSaves?: boolean } = { squashAutoSaves: true },
  ): Observable<{
    version: number;
    commit_message: string;
    squashed?: boolean;
  }> {
    return this.callMCPTool("project.save_world_sdf", {
      name: nameOrId,
      sdf,
      commit_message: commitMessage,
      squash_autosaves: opts.squashAutoSaves ?? true,
    });
  }

  /**
   * Upload a thumbnail image for a project. The body is the raw image
   * bytes; fuel-server stores it in the git repo as thumbnail.png and
   * auto-versions it. Used by the project editor after a save (manual or
   * auto) so cards on the project list reflect the current world.
   */
  uploadThumbnail(
    nameOrId: string,
    blob: Blob,
  ): Observable<{ version: number }> {
    const url = `${this.fuelProjects}/${encodeURIComponent(nameOrId)}/thumbnail`;
    return this.http.post<{ version: number }>(url, blob, {
      headers: { "Content-Type": blob.type || "image/jpeg" },
    });
  }

  /**
   * URL the browser can hit to fetch a project's thumbnail image. Tied
   * to `tip` so cards always reflect the latest commit. The auth
   * interceptor adds the JWT, so callers must fetch via HttpClient (not
   * a bare <img src>) to get the bytes.
   */
  thumbnailUrl(nameOrId: string): string {
    return `${this.fuelProjects}/${encodeURIComponent(nameOrId)}/tip/files/thumbnail.png`;
  }

  /**
   * Fetch a project's thumbnail as a blob and return a same-document
   * object URL. Emits null when the project has no thumbnail yet (404)
   * or any other fetch error — callers swap in a placeholder image.
   * Object URLs created here are owned by the caller; they should
   * URL.revokeObjectURL them when the card is destroyed.
   */
  loadThumbnailObjectURL(nameOrId: string): Observable<string | null> {
    return this.http
      .get(this.thumbnailUrl(nameOrId), { responseType: "blob" })
      .pipe(
        map((blob) => URL.createObjectURL(blob)),
        catchError(() => of(null)),
      );
  }

  // Personal Access Token CRUD lives on the existing /settings/access-
  // tokens page (UserService); the AI Builder tab links there via a
  // banner. No PAT methods here.

  // --- Chat history ---

  getChatHistory(projectId: string): Observable<ChatSession> {
    return this.http.get<ChatSession>(
      `${this.apiBase}/projects/${projectId}/chat/history`,
    );
  }

  clearChatHistory(projectId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiBase}/projects/${projectId}/chat/history`,
    );
  }

  // --- LLM keys ---

  listLLMKeys(username: string): Observable<LLMKey[]> {
    return this.http.get<LLMKey[]>(
      `${this.apiBase}/users/${username}/llm-keys`,
    );
  }

  addLLMKey(username: string, body: LLMKeyInput): Observable<LLMKey> {
    return this.http.post<LLMKey>(
      `${this.apiBase}/users/${username}/llm-keys`,
      body,
    );
  }

  deleteLLMKey(username: string, provider: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiBase}/users/${username}/llm-keys/${provider}`,
    );
  }

  listProviders(): Observable<{ providers: string[] }> {
    return this.http.get<{ providers: string[] }>(`${this.apiBase}/providers`);
  }

  listModels(provider: string): Observable<{ models: ModelInfo[] }> {
    return this.http.get<{ models: ModelInfo[] }>(
      `${this.apiBase}/providers/${encodeURIComponent(provider)}/models`,
    );
  }

  // --- Export ---

  exportZipURL(projectId: string): string {
    return `${this.apiBase}/projects/${projectId}/export/zip`;
  }

  exportToGitHub(
    projectId: string,
    body: {
      repo: string;
      branch?: string;
      commit_message?: string;
      token: string;
    },
  ): Observable<{ repo: string; branch: string; paths: string[] }> {
    return this.http.post<{ repo: string; branch: string; paths: string[] }>(
      `${this.apiBase}/projects/${projectId}/export/github`,
      body,
    );
  }

  // --- Code execution (Phase 3) ---

  startExecution(
    projectId: string,
    body: {
      entry_command: string[];
      language?: string;
      timeout_secs?: number;
      memory_mb?: number;
      cpus?: number;
    },
  ): Observable<{ execution_id: string }> {
    return this.http.post<{ execution_id: string }>(
      `${this.apiBase}/projects/${projectId}/execute`,
      body,
    );
  }

  stopExecution(projectId: string, runId: string): Observable<void> {
    return this.http.post<void>(
      `${this.apiBase}/projects/${projectId}/execute/${runId}/stop`,
      {},
    );
  }

  async *streamExecution(
    projectId: string,
    runId: string,
    authToken: string,
  ): AsyncGenerator<ExecutionEvent> {
    const resp = await fetch(
      `${this.apiBase}/projects/${projectId}/execute/${runId}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${authToken}` },
      },
    );
    if (!resp.ok || !resp.body) {
      yield {
        type: "status",
        status: "error",
        error: `HTTP ${resp.status}`,
        time: new Date().toISOString(),
      };
      return;
    }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split(/\n\n/);
      buffer = events.pop() || "";
      for (const rawEvent of events) {
        const dataLine = rawEvent
          .split("\n")
          .find((l) => l.startsWith("data:"));
        if (!dataLine) continue;
        try {
          const data = JSON.parse(dataLine.slice(5).trim());
          yield data as ExecutionEvent;
          if (
            data.type === "status" &&
            (data.status === "exited" || data.status === "error")
          ) {
            return;
          }
        } catch {
          // ignore malformed lines
        }
      }
    }
  }

  /**
   * Open an SSE stream for a chat turn. Returns an async generator that yields
   * ChatEvents as they arrive. Consumer should `for await` over it.
   *
   * Implemented via fetch() + ReadableStream rather than EventSource because
   * EventSource does not support custom headers (we need Authorization).
   *
   * Pass `opts.signal` to enable cancellation. Aborting the signal closes
   * the fetch socket, which propagates to the server as a cancelled
   * request context — ai-builder-service's chat handler is shaped to
   * tear down the LLM provider call when its context dies, so a stop
   * click on the UI also stops the agent server-side.
   */
  async *streamChat(
    projectId: string,
    message: string,
    authToken: string,
    opts?: { provider?: string; model?: string; signal?: AbortSignal },
  ): AsyncGenerator<ChatEvent> {
    const resp = await fetch(`${this.apiBase}/projects/${projectId}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        message,
        provider: opts?.provider || undefined,
        model: opts?.model || undefined,
      }),
      signal: opts?.signal,
    });
    if (!resp.ok || !resp.body) {
      yield { type: "error", error: `HTTP ${resp.status}` };
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split(/\n\n/);
      buffer = events.pop() || "";
      for (const rawEvent of events) {
        const dataLine = rawEvent
          .split("\n")
          .find((l) => l.startsWith("data:"));
        if (!dataLine) continue;
        try {
          const data = JSON.parse(dataLine.slice(5).trim());
          yield data as ChatEvent;
          if (data.type === "done" || data.type === "error") return;
        } catch {
          // ignore malformed lines
        }
      }
    }
  }
}

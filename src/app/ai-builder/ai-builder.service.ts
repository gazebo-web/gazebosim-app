import { HttpClient, HttpEvent, HttpEventType } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, Subject, catchError, map, of, shareReplay } from "rxjs";

import { environment } from "../../environments/environment";

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
  uuid?: string;
  /** Commit hash at HEAD when fetched; changes whenever any file does. */
  head_rev?: string;
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
  /** Project files attached to a user message. */
  attachments?: ChatAttachment[];
  timestamp: string;
}

/** A project file as attached to a chat message. */
export interface ChatAttachment {
  id: string;
  name: string;
  kind: string;
  summary?: string;
}

/**
 * A project file: something the user uploaded for the AI to build from
 * (a photo, drawing, floor plan, mesh or texture set). Kept beside the
 * project, not in its versions, and never exported or published.
 */
export interface ProjectAsset {
  id: string;
  name: string;
  kind: "image" | "document" | "drawing" | "mesh" | "texture";
  mime: string;
  size: number;
  status: "processing" | "ready" | "failed";
  error?: string;
  /** What processing learned: width/height, pages, files in a zip... */
  info: Record<string, unknown>;
  /** Derived files beside "original", e.g. thumb.jpg. */
  views: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

/** File types the upload accepts (the server checks content, not names). */
export const ASSET_ACCEPT =
  ".png,.jpg,.jpeg,.webp,.pdf,.svg,.dxf,.glb,.obj,.stl,.dae,.zip";

/** Most project files one chat message can carry (the server refuses more). */
export const MAX_ATTACHMENTS = 10;

export interface ChatSession {
  id: string;
  project_id: string;
  messages: ChatMessage[];
  created_at: string;
  /** A turn still running: follow it with followChat. Its messages are
   * not in `messages`; its events replay them. */
  active_turn?: ChatTurn;
}

/** One message and the agent's work on it, which runs on the server. */
export interface ChatTurn {
  turn_id: string;
  status: "running" | "done" | "failed" | "cancelled";
  message: string;
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
  type:
    | "text"
    | "tool_call"
    | "tool_result"
    | "project_changed"
    | "done"
    | "error";
  text?: string;
  tool?: string;
  tool_call_id?: string;
  input?: unknown;
  result?: unknown;
  error?: string;
  /** done: how the turn ended (done, failed or cancelled). */
  status?: string;
  /** project_changed: the file written and the new revision. */
  path?: string;
  rev?: string;
  validation?: { valid: boolean; errors: number; warnings: number };
}

/** The commit a project write produced (fuel-server WriteResult). */
/** A signed, read-only base path for one project revision's files. */
export interface ProjectFileUrl {
  base_path: string;
  rev: string;
  expires_at: string;
}

export interface WriteResult {
  version: number;
  rev: string;
  /** Auto-saves folded into a labeled save. */
  squashed?: number;
}

/** One problem from fuel-server's SDF validator. */
export interface SDFIssue {
  message: string;
  line?: number;
  path?: string;
}

export interface SDFValidation {
  valid: boolean;
  errors?: SDFIssue[];
  warnings?: SDFIssue[];
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
 *   - fuel-server (API_HOST/1.0) — authoritative for projects, files,
 *     versions, SDF validation, and personal access tokens.
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
   * Sign a read-only URL for a revision's files (default: head). The
   * viewport loads project models and meshes through it, since gzweb
   * can't attach our Authorization header to only our own requests.
   * Returns the absolute base URL plus the resolved revision.
   */
  getFileUrl(
    nameOrId: string,
    rev?: string,
  ): Observable<ProjectFileUrl & { base_url: string }> {
    const params: Record<string, string> = rev ? { rev } : {};
    return this.http
      .get<ProjectFileUrl>(
        `${this.fuelProjects}/${encodeURIComponent(nameOrId)}/file-url`,
        { params },
      )
      .pipe(
        map((u) => ({
          ...u,
          base_url: `${environment.API_HOST}${u.base_path}`,
        })),
      );
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

  // --- Project files (fuel-server) ---

  /**
   * Write one project file. With `baseRev`, fuel-server answers 409 if
   * the file changed since that revision (e.g. the agent edited it). An
   * empty message records an automatic save.
   */
  writeProjectFile(
    nameOrId: string,
    path: string,
    content: string,
    opts: { baseRev?: string; message?: string } = {},
  ): Observable<WriteResult> {
    const url = `${this.fuelProjects}/${encodeURIComponent(nameOrId)}/files/${path
      .split("/")
      .map((p) => encodeURIComponent(p))
      .join("/")}`;
    return this.http.put<WriteResult>(url, {
      content,
      base_rev: opts.baseRev || undefined,
      message: opts.message || undefined,
    });
  }

  /**
   * Save a labeled version: fuel-server folds the automatic saves since
   * the last labeled version into it.
   */
  checkpoint(nameOrId: string, message: string): Observable<WriteResult> {
    return this.http.post<WriteResult>(
      `${this.fuelProjects}/${encodeURIComponent(nameOrId)}/checkpoint`,
      { message },
    );
  }

  /** Validate SDF with fuel-server's validator (the one the agent uses). */
  validateSDF(sdf: string): Observable<SDFValidation> {
    return this.http.post<SDFValidation>(`${this.fuelBase}/sdf/validate`, {
      sdf,
    });
  }

  /**
   * Upload a thumbnail image for a project. The body is the raw image
   * bytes; fuel-server stores it as thumbnail.png, amended into the
   * current version (no new history entry). Called after saves so cards
   * on the project list reflect the current world.
   */
  uploadThumbnail(nameOrId: string, blob: Blob): Observable<WriteResult> {
    const url = `${this.fuelProjects}/${encodeURIComponent(nameOrId)}/thumbnail`;
    return this.http.post<WriteResult>(url, blob, {
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

  // --- Project files (fuel-server) ---

  /** Emits a project name whenever its files change in this tab. */
  readonly assetsChanged$ = new Subject<string>();
  private assetsBases = new Map<
    string,
    { base: Observable<string>; expires: number }
  >();

  /**
   * Upload files to a project. Emits upload progress events, then the
   * response with the added files. `kind: "texture"` marks images as a
   * material.
   */
  uploadAssets(
    nameOrId: string,
    files: File[],
    kind?: string,
  ): Observable<HttpEvent<ProjectAsset[]>> {
    const form = new FormData();
    for (const f of files) form.append("file", f, f.name);
    if (kind) form.append("kind", kind);
    return this.http.post<ProjectAsset[]>(
      `${this.fuelProjects}/${encodeURIComponent(nameOrId)}/assets`,
      form,
      { reportProgress: true, observe: "events" },
    );
  }

  /**
   * Upload files, reporting progress as a fraction; resolves with the
   * added files and tells assetsChanged$.
   */
  uploadAssetsWithProgress(
    nameOrId: string,
    files: File[],
    onProgress?: (fraction: number) => void,
    kind?: string,
  ): Promise<ProjectAsset[]> {
    return new Promise((resolve, reject) => {
      this.uploadAssets(nameOrId, files, kind).subscribe({
        next: (ev) => {
          if (ev.type === HttpEventType.UploadProgress && ev.total) {
            onProgress?.(ev.loaded / ev.total);
          } else if (ev.type === HttpEventType.Response) {
            this.assetsChanged$.next(nameOrId);
            resolve(ev.body ?? []);
          }
        },
        error: reject,
      });
    });
  }

  listAssets(nameOrId: string): Observable<ProjectAsset[]> {
    return this.http
      .get<
        ProjectAsset[] | null
      >(`${this.fuelProjects}/${encodeURIComponent(nameOrId)}/assets`)
      .pipe(map((l) => l ?? []));
  }

  renameAsset(
    nameOrId: string,
    id: string,
    name: string,
  ): Observable<ProjectAsset> {
    return this.http.patch<ProjectAsset>(
      `${this.fuelProjects}/${encodeURIComponent(nameOrId)}/assets/${id}`,
      { name },
    );
  }

  /** The message of a failed project-file request, for the user. */
  assetError(err: any): string {
    return (
      err?.error?.msg || err?.error?.error || err?.message || "request failed"
    );
  }

  /** Re-run processing of a file whose processing failed. */
  retryAsset(nameOrId: string, id: string): Observable<ProjectAsset> {
    return this.http.post<ProjectAsset>(
      `${this.fuelProjects}/${encodeURIComponent(nameOrId)}/assets/${id}/retry`,
      null,
    );
  }

  deleteAsset(nameOrId: string, id: string): Observable<unknown> {
    return this.http.delete(
      `${this.fuelProjects}/${encodeURIComponent(nameOrId)}/assets/${id}`,
    );
  }

  /**
   * The signed base URL of a project's files, so <img> tags can show
   * thumbnails without the Authorization header. Cached until shortly
   * before it expires. Files are at `${base}/${id}/${file}`.
   */
  assetsBase(nameOrId: string): Observable<string> {
    const cached = this.assetsBases.get(nameOrId);
    if (cached && cached.expires > Date.now()) return cached.base;
    const base = this.http
      .get<{
        base_path: string;
        expires_at: string;
      }>(`${this.fuelProjects}/${encodeURIComponent(nameOrId)}/assets-url`)
      .pipe(
        map((u) => {
          this.assetsBases.set(nameOrId, {
            base,
            expires: new Date(u.expires_at).getTime() - 5 * 60_000,
          });
          return `${environment.API_HOST}${u.base_path}`;
        }),
        shareReplay(1),
      );
    this.assetsBases.set(nameOrId, { base, expires: Date.now() + 60_000 });
    return base;
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

  /** The project's files at HEAD as a zip (fuel-server). */
  exportZip(projectId: string): Observable<Blob> {
    return this.http.get(
      `${this.fuelProjects}/${encodeURIComponent(projectId)}/export.zip`,
      { responseType: "blob" },
    );
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
    opts?: {
      provider?: string;
      model?: string;
      /** Ids of project files to send with the message. */
      attachments?: string[];
      signal?: AbortSignal;
      onTurn?: (turnId: string) => void;
    },
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
        attachments: opts?.attachments?.length ? opts.attachments : undefined,
      }),
      signal: opts?.signal,
    });
    yield* this.readEvents(resp, opts?.onTurn);
  }

  /**
   * Follow a turn that is already running (after a page reload, say),
   * from the start or after an event id.
   */
  async *followChat(
    projectId: string,
    turnId: string,
    authToken: string,
    opts?: { after?: string; signal?: AbortSignal },
  ): AsyncGenerator<ChatEvent> {
    const q = new URLSearchParams({ turn: turnId });
    if (opts?.after) q.set("after", opts.after);
    const resp = await fetch(
      `${this.apiBase}/projects/${projectId}/chat/stream?${q}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
        signal: opts?.signal,
      },
    );
    yield* this.readEvents(resp);
  }

  /** Stop a running turn; its stream then ends with a cancelled done. */
  cancelChat(projectId: string, turnId: string): Observable<unknown> {
    return this.http.post(
      `${this.apiBase}/projects/${projectId}/chat/${turnId}/cancel`,
      {},
    );
  }

  private async *readEvents(
    resp: Response,
    onTurn?: (turnId: string) => void,
  ): AsyncGenerator<ChatEvent> {
    if (!resp.ok || !resp.body) {
      let error = `HTTP ${resp.status}`;
      try {
        error = (await resp.json()).error || error;
      } catch {
        // not JSON; keep the status
      }
      yield { type: "error", error };
      return;
    }
    const turnId = resp.headers.get("X-Turn-ID");
    if (turnId) onTurn?.(turnId);

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

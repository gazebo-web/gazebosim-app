import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

import { environment } from "../../environments/environment";

export interface AiBuilderProject {
  id: string;
  name: string;
  owner: string;
  description: string;
  gazebo_version: string;
  sdf_version: string;
  ros2_distro: string;
  github_repo?: string;
  gazebo_ws_url?: string;
  gazebo_ws_key?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectVersion {
  id: string;
  project_id: string;
  version: number;
  world_sdf: string;
  commit_message: string;
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

export interface LLMConfig {
  user_id: string;
  provider: string;
  api_key_masked?: string;
  endpoint?: string;
  model: string;
  telemetry_opt_in: boolean;
  created_at?: string;
  updated_at?: string;
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
 * Client for the AI Builder backend service.
 */
@Injectable({ providedIn: "root" })
export class AiBuilderService {
  private readonly base =
    environment.AI_BUILDER_HOST || "http://localhost:8010";
  private readonly apiBase = `${this.base}/1.0/ai-builder`;

  constructor(private http: HttpClient) {}

  // --- Projects ---

  createProject(body: Partial<AiBuilderProject>): Observable<AiBuilderProject> {
    return this.http.post<AiBuilderProject>(`${this.apiBase}/projects`, body);
  }

  listProjects(): Observable<AiBuilderProject[]> {
    return this.http.get<AiBuilderProject[]>(`${this.apiBase}/projects`);
  }

  getProject(id: string): Observable<AiBuilderProject> {
    return this.http.get<AiBuilderProject>(`${this.apiBase}/projects/${id}`);
  }

  updateProject(
    id: string,
    body: Partial<AiBuilderProject>,
  ): Observable<AiBuilderProject> {
    return this.http.patch<AiBuilderProject>(
      `${this.apiBase}/projects/${id}`,
      body,
    );
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiBase}/projects/${id}`);
  }

  // --- Versions ---

  listVersions(projectId: string): Observable<ProjectVersion[]> {
    return this.http.get<ProjectVersion[]>(
      `${this.apiBase}/projects/${projectId}/versions`,
    );
  }

  createVersion(
    projectId: string,
    worldSdf: string,
    message: string,
  ): Observable<ProjectVersion> {
    return this.http.post<ProjectVersion>(
      `${this.apiBase}/projects/${projectId}/versions`,
      { world_sdf: worldSdf, commit_message: message },
    );
  }

  getVersion(projectId: string, version: number): Observable<ProjectVersion> {
    return this.http.get<ProjectVersion>(
      `${this.apiBase}/projects/${projectId}/versions/${version}`,
    );
  }

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

  // --- LLM config ---

  getLLMConfig(username: string): Observable<LLMConfig> {
    return this.http.get<LLMConfig>(
      `${this.apiBase}/users/${username}/llm-config`,
    );
  }

  putLLMConfig(
    username: string,
    body: Partial<LLMConfig> & { api_key?: string },
  ): Observable<LLMConfig> {
    return this.http.put<LLMConfig>(
      `${this.apiBase}/users/${username}/llm-config`,
      body,
    );
  }

  deleteLLMConfig(username: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiBase}/users/${username}/llm-config`,
    );
  }

  listProviders(): Observable<{ providers: string[] }> {
    return this.http.get<{ providers: string[] }>(`${this.apiBase}/providers`);
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
   */
  async *streamChat(
    projectId: string,
    message: string,
    authToken: string,
  ): AsyncGenerator<ChatEvent> {
    const resp = await fetch(`${this.apiBase}/projects/${projectId}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ message }),
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

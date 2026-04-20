import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Subject, takeUntil } from "rxjs";

import { AuthService } from "../auth/auth.service";
import {
  AiBuilderProject,
  AiBuilderService,
  ChatEvent,
  ChatMessage,
  ProjectVersion,
} from "./ai-builder.service";
import {
  GazeboConnectionDialogComponent,
  GazeboConnectionDialogData,
} from "./gazebo-connection-dialog/gazebo-connection-dialog.component";
import {
  GitHubExportDialogComponent,
  GitHubExportResult,
} from "./github-export-dialog/github-export-dialog.component";

interface ChatLogEntry {
  role: "user" | "assistant" | "tool";
  text: string;
  toolName?: string;
}

@Component({
  selector: "ai-builder",
  templateUrl: "./ai-builder.component.html",
  styleUrls: ["./ai-builder.component.scss"],
  standalone: false,
})
export class AiBuilderComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  project?: AiBuilderProject;
  log: ChatLogEntry[] = [];
  currentAssistant = "";
  draftMessage = "";
  sending = false;
  worldSDF = "";
  error = "";
  showSDF = false;
  showHistory = false;
  showExecution = false;

  constructor(
    private route: ActivatedRoute,
    private service: AiBuilderService,
    private auth: AuthService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = params.get("projectId");
      if (id) this.loadProject(id);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadProject(id: string): void {
    this.service.getProject(id).subscribe({
      next: (p) => {
        this.project = p;
        this.loadHistory();
        this.loadLatestVersion();
      },
      error: (err) => (this.error = err?.message || "failed to load project"),
    });
  }

  private loadHistory(): void {
    if (!this.project) return;
    this.service.getChatHistory(this.project.id).subscribe({
      next: (session) => {
        this.log = session.messages
          .filter(
            (m) =>
              m.role === "user" ||
              m.role === "assistant" ||
              m.role === "tool_result",
          )
          .map((m) => this.toLogEntry(m));
      },
      error: () => {
        // Ignore — new sessions may have no history.
      },
    });
  }

  private toLogEntry(m: ChatMessage): ChatLogEntry {
    if (m.role === "tool_result") {
      return { role: "tool", text: m.content, toolName: m.tool_name };
    }
    return { role: m.role === "user" ? "user" : "assistant", text: m.content };
  }

  private loadLatestVersion(): void {
    if (!this.project) return;
    this.service.listVersions(this.project.id).subscribe((versions) => {
      if (versions.length > 0) {
        this.worldSDF = versions[0].world_sdf;
      }
    });
  }

  async sendMessage(): Promise<void> {
    if (!this.project || !this.draftMessage.trim() || this.sending) return;
    const text = this.draftMessage.trim();
    this.draftMessage = "";
    this.sending = true;
    this.log.push({ role: "user", text });
    this.currentAssistant = "";

    const token = localStorage.getItem("token") || "dev-user";

    try {
      const stream = this.service.streamChat(this.project.id, text, token);
      for await (const ev of stream) {
        this.handleEvent(ev);
      }
    } catch (err: any) {
      this.error = err?.message || "stream failed";
    } finally {
      if (this.currentAssistant) {
        this.log.push({ role: "assistant", text: this.currentAssistant });
        this.currentAssistant = "";
      }
      this.sending = false;
    }
  }

  private handleEvent(ev: ChatEvent): void {
    switch (ev.type) {
      case "text":
        if (ev.text) this.currentAssistant += ev.text;
        break;
      case "tool_call":
        this.log.push({
          role: "tool",
          text: `→ calling ${ev.tool}(${JSON.stringify(ev.input || {})})`,
          toolName: ev.tool,
        });
        break;
      case "tool_result":
        this.log.push({
          role: "tool",
          text: `← ${ev.tool} returned`,
          toolName: ev.tool,
        });
        break;
      case "sdf_update":
        if (ev.sdf) this.worldSDF = ev.sdf;
        break;
      case "error":
        this.error = ev.error || "error";
        break;
    }
  }

  toggleSDF(): void {
    this.showSDF = !this.showSDF;
  }

  toggleHistory(): void {
    this.showHistory = !this.showHistory;
  }

  toggleExecution(): void {
    this.showExecution = !this.showExecution;
  }

  saveVersion(): void {
    if (!this.project || !this.worldSDF) return;
    const msg = prompt("Commit message:", "snapshot");
    if (msg === null) return;
    this.service
      .createVersion(this.project.id, this.worldSDF, msg || "")
      .subscribe({
        next: () => this.snack.open("Saved.", "Dismiss", { duration: 2000 }),
        error: (err) => (this.error = err?.message || "save failed"),
      });
  }

  clearChat(): void {
    if (!this.project) return;
    if (!confirm("Clear the entire chat history for this project?")) return;
    this.service.clearChatHistory(this.project.id).subscribe(() => {
      this.log = [];
    });
  }

  restoreVersion(v: ProjectVersion): void {
    this.worldSDF = v.world_sdf;
    this.snack.open(
      `Restored v${v.version} into editor. Save to lock it in as a new version.`,
      "Dismiss",
      { duration: 4000 },
    );
  }

  configureGazebo(): void {
    if (!this.project) return;
    const ref = this.dialog.open<
      GazeboConnectionDialogComponent,
      GazeboConnectionDialogData,
      GazeboConnectionDialogData | null
    >(GazeboConnectionDialogComponent, {
      width: "520px",
      data: {
        url: this.project.gazebo_ws_url || "",
        key: this.project.gazebo_ws_key || "",
      },
    });
    ref.afterClosed().subscribe((result) => {
      if (result === null || !this.project) return;
      this.service
        .updateProject(this.project.id, {
          gazebo_ws_url: result.url,
          gazebo_ws_key: result.key,
        })
        .subscribe({
          next: (p) => {
            this.project = p;
            this.snack.open(
              result.url ? "Gazebo connection saved." : "Disconnected.",
              "Dismiss",
              { duration: 2000 },
            );
          },
          error: (err) => (this.error = err?.message || "save failed"),
        });
    });
  }

  downloadZip(): void {
    if (!this.project) return;
    window.open(this.service.exportZipURL(this.project.id), "_blank");
  }

  pushToGitHub(): void {
    if (!this.project) return;
    const ref = this.dialog.open(GitHubExportDialogComponent, {
      width: "520px",
      data: { defaultRepo: this.project.github_repo || "" },
    });
    ref.afterClosed().subscribe((result: GitHubExportResult | null) => {
      if (!result || !this.project) return;
      this.service.exportToGitHub(this.project.id, result).subscribe({
        next: (resp) => {
          this.snack.open(
            `Pushed ${resp.paths.length} files to ${resp.repo}.`,
            "Dismiss",
            { duration: 4000 },
          );
          // Remember the repo for next time.
          if (this.project) {
            this.service
              .updateProject(this.project.id, { github_repo: result.repo })
              .subscribe((p) => (this.project = p));
          }
        },
        error: (err) =>
          (this.error = err?.error?.error || err?.message || "push failed"),
      });
    });
  }

  get gazeboStatusLabel(): string {
    if (!this.project?.gazebo_ws_url) return "Not connected";
    return this.project.gazebo_ws_url;
  }
}

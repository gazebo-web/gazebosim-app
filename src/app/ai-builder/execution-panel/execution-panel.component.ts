import { Component, Input, OnDestroy } from "@angular/core";

import { AiBuilderService, ExecutionEvent } from "../ai-builder.service";

interface LogLine {
  kind: "stdout" | "stderr" | "status";
  text: string;
}

@Component({
  selector: "ai-builder-execution-panel",
  templateUrl: "./execution-panel.component.html",
  styleUrls: ["./execution-panel.component.scss"],
  standalone: false,
})
export class ExecutionPanelComponent implements OnDestroy {
  @Input() projectId = "";
  @Input() defaultPackage = "";

  log: LogLine[] = [];
  running = false;
  exitCode: number | null = null;
  entryCommand = "ros2 run <pkg> velocity_controller";
  private runId = "";

  constructor(private service: AiBuilderService) {}

  ngOnDestroy(): void {
    // Streams self-terminate when the Angular component is destroyed because
    // the HTTP fetch is cancelled by the browser when the page navigates.
  }

  async run(): Promise<void> {
    if (!this.projectId || this.running) return;
    this.log = [];
    this.exitCode = null;
    this.running = true;

    const tokens = this.entryCommand.trim().split(/\s+/);
    try {
      const start = await this.service
        .startExecution(this.projectId, {
          entry_command: tokens,
        })
        .toPromise();
      if (!start) {
        this.running = false;
        return;
      }
      this.runId = start.execution_id;
      await this.follow(this.runId);
    } catch (err: any) {
      this.log.push({ kind: "status", text: `error: ${err?.message || err}` });
      this.running = false;
    }
  }

  stop(): void {
    if (!this.projectId || !this.runId) return;
    this.service.stopExecution(this.projectId, this.runId).subscribe();
  }

  private async follow(runId: string): Promise<void> {
    const token = localStorage.getItem("token") || "dev-user";
    const stream = this.service.streamExecution(this.projectId, runId, token);
    for await (const ev of stream) {
      this.handleEvent(ev);
    }
    this.running = false;
  }

  private handleEvent(ev: ExecutionEvent): void {
    if (ev.type === "stdout" || ev.type === "stderr") {
      this.log.push({ kind: ev.type, text: ev.line || "" });
    } else if (ev.type === "status") {
      if (ev.status === "started") {
        this.log.push({ kind: "status", text: "[started]" });
      } else if (ev.status === "exited") {
        this.exitCode = ev.code ?? 0;
        this.log.push({ kind: "status", text: `[exited ${this.exitCode}]` });
      } else if (ev.status === "error") {
        this.log.push({ kind: "status", text: `[error] ${ev.error || ""}` });
      }
    }
  }
}

import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";

import { ConfirmationDialogComponent } from "../../confirmation-dialog/confirmation-dialog.component";
import { AiBuilderProject, AiBuilderService } from "../ai-builder.service";
import { NewProjectDialogComponent } from "../new-project-dialog/new-project-dialog.component";

@Component({
  selector: "ai-builder-project-list",
  templateUrl: "./ai-builder-project-list.component.html",
  styleUrls: ["./ai-builder-project-list.component.scss"],
  standalone: false,
})
export class AiBuilderProjectListComponent implements OnInit, OnDestroy {
  projects: AiBuilderProject[] = [];
  loading = true;
  error = "";
  // Per-project blob URLs. Empty entry → render the placeholder. Keyed
  // by project.id so the template stays simple and reactive.
  thumbnails: Record<string, string> = {};
  readonly placeholderThumbnail =
    "assets/images/ai-builder-thumbnail-placeholder.svg";

  constructor(
    private service: AiBuilderService,
    private router: Router,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.reload();
  }

  ngOnDestroy(): void {
    this.revokeThumbnails();
  }

  reload(): void {
    this.loading = true;
    this.service.listProjects().subscribe({
      next: (list) => {
        this.projects = list;
        this.loading = false;
        this.loadThumbnails(list);
      },
      error: (err) => {
        this.error = err?.message || "failed to load projects";
        this.loading = false;
      },
    });
  }

  thumbnailFor(project: AiBuilderProject): string {
    return this.thumbnails[project.id] || this.placeholderThumbnail;
  }

  private loadThumbnails(list: AiBuilderProject[]): void {
    this.revokeThumbnails();
    for (const p of list) {
      this.service.loadThumbnailObjectURL(p.id).subscribe((url) => {
        if (url) this.thumbnails[p.id] = url;
      });
    }
  }

  private revokeThumbnails(): void {
    for (const url of Object.values(this.thumbnails)) {
      URL.revokeObjectURL(url);
    }
    this.thumbnails = {};
  }

  open(project: AiBuilderProject): void {
    this.router.navigate(["/projects", project.id]);
  }

  newProject(): void {
    const ref = this.dialog.open(NewProjectDialogComponent, { width: "480px" });
    ref
      .afterClosed()
      .subscribe((result: Partial<AiBuilderProject> | undefined) => {
        if (!result) return;
        this.service.createProject(result).subscribe({
          next: (created) => this.router.navigate(["/projects", created.id]),
          error: (err) =>
            (this.error = err?.message || "failed to create project"),
        });
      });
  }

  delete(project: AiBuilderProject, event: Event): void {
    event.stopPropagation();

    const ref = this.dialog.open<
      ConfirmationDialogComponent,
      unknown,
      boolean | undefined
    >(ConfirmationDialogComponent, {
      width: "420px",
      data: {
        title: "Delete Project",
        message: `Delete <strong>${project.name}</strong>? This cannot be undone.`,
        buttonText: "Delete",
        hasInput: false,
      },
    });

    ref.afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.service.deleteProject(project.id).subscribe(() => this.reload());
    });
  }
}

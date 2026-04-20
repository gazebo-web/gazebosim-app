import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";

import { AiBuilderProject, AiBuilderService } from "../ai-builder.service";
import { NewProjectDialogComponent } from "../new-project-dialog/new-project-dialog.component";

@Component({
  selector: "ai-builder-project-list",
  templateUrl: "./ai-builder-project-list.component.html",
  styleUrls: ["./ai-builder-project-list.component.scss"],
  standalone: false,
})
export class AiBuilderProjectListComponent implements OnInit {
  projects: AiBuilderProject[] = [];
  loading = true;
  error = "";

  constructor(
    private service: AiBuilderService,
    private router: Router,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.service.listProjects().subscribe({
      next: (list) => {
        this.projects = list;
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.message || "failed to load projects";
        this.loading = false;
      },
    });
  }

  open(project: AiBuilderProject): void {
    this.router.navigate(["/ai-builder", project.id]);
  }

  newProject(): void {
    const ref = this.dialog.open(NewProjectDialogComponent, { width: "480px" });
    ref
      .afterClosed()
      .subscribe((result: Partial<AiBuilderProject> | undefined) => {
        if (!result) return;
        this.service.createProject(result).subscribe({
          next: (created) => this.router.navigate(["/ai-builder", created.id]),
          error: (err) =>
            (this.error = err?.message || "failed to create project"),
        });
      });
  }

  delete(project: AiBuilderProject, event: Event): void {
    event.stopPropagation();
    if (!confirm(`Delete project "${project.name}"? This cannot be undone.`))
      return;
    this.service.deleteProject(project.id).subscribe(() => this.reload());
  }
}

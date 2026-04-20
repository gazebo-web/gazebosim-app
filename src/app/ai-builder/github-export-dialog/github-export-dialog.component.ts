import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

export interface GitHubExportDialogData {
  defaultRepo?: string;
}

export interface GitHubExportResult {
  repo: string;
  branch: string;
  commit_message: string;
  token: string;
}

@Component({
  selector: "github-export-dialog",
  templateUrl: "./github-export-dialog.component.html",
  styleUrls: ["./github-export-dialog.component.scss"],
  standalone: false,
})
export class GitHubExportDialogComponent {
  repo = "";
  branch = "";
  commitMessage = "";
  token = "";

  constructor(
    private ref: MatDialogRef<
      GitHubExportDialogComponent,
      GitHubExportResult | null
    >,
    @Inject(MAT_DIALOG_DATA) data: GitHubExportDialogData,
  ) {
    this.repo = data?.defaultRepo || "";
  }

  cancel(): void {
    this.ref.close(null);
  }

  submit(): void {
    if (!this.repo || !this.token) return;
    this.ref.close({
      repo: this.repo.trim(),
      branch: this.branch.trim(),
      commit_message: this.commitMessage.trim(),
      token: this.token,
    });
  }
}

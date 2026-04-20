import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from "@angular/core";

import { AiBuilderService, ProjectVersion } from "../ai-builder.service";

@Component({
  selector: "ai-builder-version-history",
  templateUrl: "./version-history.component.html",
  styleUrls: ["./version-history.component.scss"],
  standalone: false,
})
export class VersionHistoryComponent implements OnChanges {
  @Input() projectId = "";
  @Output() restore = new EventEmitter<ProjectVersion>();

  versions: ProjectVersion[] = [];
  loading = false;

  constructor(private service: AiBuilderService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["projectId"] && this.projectId) {
      this.reload();
    }
  }

  reload(): void {
    if (!this.projectId) return;
    this.loading = true;
    this.service.listVersions(this.projectId).subscribe({
      next: (vs) => {
        this.versions = vs;
        this.loading = false;
      },
      error: () => (this.loading = false),
    });
  }

  restoreVersion(v: ProjectVersion): void {
    this.restore.emit(v);
  }
}

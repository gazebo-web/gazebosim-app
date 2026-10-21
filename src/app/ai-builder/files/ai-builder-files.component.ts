import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Subject, filter, takeUntil } from "rxjs";

import {
  ASSET_ACCEPT,
  AiBuilderService,
  ProjectAsset,
} from "../ai-builder.service";

/**
 * The project's files: photos, drawings, floor plans, meshes and texture
 * sets the user uploads for the AI to build from. Drop files anywhere on
 * the panel or use Upload; attach one to the chat with its menu.
 */
@Component({
  selector: "ai-builder-files",
  templateUrl: "./ai-builder-files.component.html",
  styleUrls: ["./ai-builder-files.component.scss"],
  standalone: false,
})
export class AiBuilderFilesComponent implements OnInit, OnChanges, OnDestroy {
  @Input() projectId = "";
  /** The user chose to attach a file to their next chat message. */
  @Output() attach = new EventEmitter<ProjectAsset>();

  readonly accept = ASSET_ACCEPT;
  assets: ProjectAsset[] = [];
  base = "";
  loading = false;
  /** Upload progress 0-1 while uploading, else null. */
  progress: number | null = null;
  dragging = false;
  renaming: string | null = null;
  renameValue = "";
  confirmDelete: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private service: AiBuilderService,
    private snack: MatSnackBar,
  ) {}

  ngOnInit(): void {
    // Uploads from the chat show up here too.
    this.service.assetsChanged$
      .pipe(
        filter((p) => p === this.projectId),
        takeUntil(this.destroy$),
      )
      .subscribe(() => this.reload());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["projectId"] && this.projectId) this.reload();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  reload(): void {
    this.loading = true;
    this.service.assetsBase(this.projectId).subscribe({
      next: (b) => (this.base = b),
    });
    this.service.listAssets(this.projectId).subscribe({
      next: (list) => {
        this.assets = list;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.snack.open(
          `Could not list files: ${this.service.assetError(err)}`,
          "Dismiss",
          { duration: 6000 },
        );
      },
    });
  }

  trackId(_: number, a: ProjectAsset): string {
    return a.id;
  }

  thumb(a: ProjectAsset): string | null {
    return this.base && a.views.includes("thumb.jpg")
      ? `${this.base}/${a.id}/thumb.jpg`
      : null;
  }

  downloadUrl(a: ProjectAsset): string {
    return `${this.base}/${a.id}/original?download=1`;
  }

  icon(a: ProjectAsset): string {
    switch (a.kind) {
      case "document":
        return "picture_as_pdf";
      case "drawing":
        return "architecture";
      case "mesh":
        return "view_in_ar";
      case "texture":
        return "texture";
      default:
        return "image";
    }
  }

  describe(a: ProjectAsset): string {
    const parts: string[] = [a.kind];
    if (a.info?.["width"]) parts.push(`${a.info["width"]}×${a.info["height"]}`);
    parts.push(formatSize(a.size));
    return parts.join(" · ");
  }

  onPick(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = "";
    this.upload(files);
  }

  onDragOver(ev: DragEvent): void {
    if (!ev.dataTransfer?.types.includes("Files")) return;
    ev.preventDefault();
    this.dragging = true;
  }

  onDrop(ev: DragEvent): void {
    ev.preventDefault();
    this.dragging = false;
    this.upload(Array.from(ev.dataTransfer?.files ?? []));
  }

  async upload(files: File[]): Promise<void> {
    if (!files.length || this.progress !== null) return;
    this.progress = 0;
    try {
      const added = await this.service.uploadAssetsWithProgress(
        this.projectId,
        files,
        (f) => (this.progress = f),
      );
      this.snack.open(
        added.length === 1
          ? `Added ${added[0].name}`
          : `Added ${added.length} files`,
        undefined,
        { duration: 3000 },
      );
    } catch (err) {
      this.snack.open(
        `Upload failed: ${this.service.assetError(err)}`,
        "Dismiss",
        { duration: 8000 },
      );
    } finally {
      this.progress = null;
    }
  }

  startRename(a: ProjectAsset): void {
    this.renaming = a.id;
    this.renameValue = a.name;
  }

  finishRename(a: ProjectAsset): void {
    const name = this.renameValue.trim();
    this.renaming = null;
    if (!name || name === a.name) return;
    this.service.renameAsset(this.projectId, a.id, name).subscribe({
      next: (updated) => (a.name = updated.name),
      error: (err) =>
        this.snack.open(
          `Rename failed: ${this.service.assetError(err)}`,
          "Dismiss",
          { duration: 6000 },
        ),
    });
  }

  remove(a: ProjectAsset): void {
    if (this.confirmDelete !== a.id) {
      this.confirmDelete = a.id;
      return;
    }
    this.confirmDelete = null;
    this.service.deleteAsset(this.projectId, a.id).subscribe({
      next: () => (this.assets = this.assets.filter((x) => x.id !== a.id)),
      error: (err) =>
        this.snack.open(
          `Delete failed: ${this.service.assetError(err)}`,
          "Dismiss",
          { duration: 6000 },
        ),
    });
  }
}

export function formatSize(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

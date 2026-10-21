import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import {
  EMPTY,
  Subject,
  catchError,
  filter,
  firstValueFrom,
  interval,
  switchMap,
  takeUntil,
} from "rxjs";

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
  /** A file was deleted; emits its id. */
  @Output() deleted = new EventEmitter<string>();
  @ViewChild("renameInput") private renameInput?: ElementRef<HTMLInputElement>;

  readonly accept = ASSET_ACCEPT;
  assets: ProjectAsset[] = [];
  base = "";
  loading = false;
  /** Upload progress 0-1 while uploading, else null. */
  progress: number | null = null;
  dragging = false;
  // dragenter/dragleave fire for every child crossed; count them so the
  // outline doesn't flicker.
  private dragDepth = 0;
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
    // Show processing results as they finish.
    interval(5000)
      .pipe(
        filter(
          () =>
            !document.hidden &&
            this.assets.some((a) => a.status === "processing"),
        ),
        switchMap(() =>
          this.service.listAssets(this.projectId).pipe(catchError(() => EMPTY)),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe((list) => (this.assets = list));
    // The thumbnail URLs are signed for an hour; the service hands out a
    // new base 5 minutes before that, so check more often than that.
    interval(4 * 60_000)
      .pipe(
        switchMap(() =>
          this.service.assetsBase(this.projectId).pipe(catchError(() => EMPTY)),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe((b) => {
        if (b !== this.base) this.base = b;
      });
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

  /**
   * Download the original. The link is built now from a fresh signed
   * base, so an expired one never sends the app to an error page.
   */
  async download(a: ProjectAsset): Promise<void> {
    try {
      const base = await firstValueFrom(
        this.service.assetsBase(this.projectId),
      );
      const link = document.createElement("a");
      link.href = `${base}/${a.id}/original?download=1`;
      link.download = a.name;
      link.click();
    } catch (err) {
      this.snack.open(
        `Download failed: ${this.service.assetError(err)}`,
        "Dismiss",
        { duration: 6000 },
      );
    }
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

  onDragEnter(ev: DragEvent): void {
    if (!ev.dataTransfer?.types.includes("Files")) return;
    this.dragDepth++;
    this.dragging = true;
  }

  onDragOver(ev: DragEvent): void {
    if (!ev.dataTransfer?.types.includes("Files")) return;
    ev.preventDefault();
  }

  onDragLeave(ev: DragEvent): void {
    if (!ev.dataTransfer?.types.includes("Files")) return;
    this.dragDepth = Math.max(0, this.dragDepth - 1);
    if (!this.dragDepth) this.dragging = false;
  }

  onDrop(ev: DragEvent): void {
    // Dropped text goes into the rename box as usual.
    if (!ev.dataTransfer?.types.includes("Files")) return;
    ev.preventDefault();
    this.dragDepth = 0;
    this.dragging = false;
    this.upload(Array.from(ev.dataTransfer.files));
  }

  async upload(files: File[]): Promise<void> {
    if (!files.length) return;
    if (this.progress !== null) {
      this.snack.open("Wait for the current upload to finish", "Dismiss", {
        duration: 4000,
      });
      return;
    }
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
    // After the menu has closed and given focus back to its button.
    setTimeout(() => {
      const input = this.renameInput?.nativeElement;
      input?.focus();
      input?.select();
    });
  }

  cancelRename(): void {
    this.renaming = null;
    this.renameValue = "";
  }

  finishRename(a: ProjectAsset): void {
    // Escape, or the blur that follows Enter, already ended it.
    if (this.renaming !== a.id) return;
    const name = this.renameValue.trim();
    this.renaming = null;
    if (!name || name === a.name) return;
    this.service.renameAsset(this.projectId, a.id, name).subscribe({
      // The list may have been reloaded meanwhile.
      next: (updated) =>
        (this.assets = this.assets.map((x) =>
          x.id === updated.id ? updated : x,
        )),
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
      next: () => {
        this.assets = this.assets.filter((x) => x.id !== a.id);
        this.deleted.emit(a.id);
      },
      error: (err) =>
        this.snack.open(
          `Delete failed: ${this.service.assetError(err)}`,
          "Dismiss",
          { duration: 6000 },
        ),
    });
  }

  /** Process a file whose processing failed again. */
  retry(a: ProjectAsset): void {
    this.service.retryAsset(this.projectId, a.id).subscribe({
      next: (updated) =>
        (this.assets = this.assets.map((x) =>
          x.id === updated.id ? updated : x,
        )),
      error: (err) =>
        this.snack.open(
          `Retry failed: ${this.service.assetError(err)}`,
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

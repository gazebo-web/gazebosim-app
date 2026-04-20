import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from "@angular/core";

import { AssetViewer, AssetViewerConfig } from "gzweb";

/**
 * 3D viewport component for the AI Builder page.
 *
 * Phase 1: renders static SDF via gzweb's AssetViewer. AssetViewer expects
 * file URLs, so we serve the inline SDF from a blob URL. This works for
 * primitive-only worlds; models that <include> Fuel URIs will also load as
 * long as the SDF parser can resolve them.
 */
@Component({
  selector: "ai-builder-viewport",
  templateUrl: "./ai-builder-viewport.component.html",
  styleUrls: ["./ai-builder-viewport.component.scss"],
  standalone: false,
})
export class AiBuilderViewportComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input() sdf = "";

  @ViewChild("container", { static: true })
  container!: ElementRef<HTMLDivElement>;

  private viewer?: AssetViewer;
  private currentBlobURL?: string;
  private viewerReady = false;
  private readonly containerId = `ai-builder-viewport-${Math.random().toString(36).slice(2, 9)}`;

  ngAfterViewInit(): void {
    // The container element id is set dynamically so multiple instances
    // can coexist (e.g., if a project list preview is ever added).
    this.container.nativeElement.id = this.containerId;
    this.viewerReady = true;
    if (this.sdf) this.render(this.sdf);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["sdf"] && this.viewerReady) {
      this.render(this.sdf);
    }
  }

  ngOnDestroy(): void {
    this.destroyViewer();
    this.revokeBlob();
  }

  private render(sdf: string): void {
    this.destroyViewer();
    this.revokeBlob();

    if (!sdf || !sdf.trim()) return;

    const blob = new Blob([sdf], { type: "application/xml" });
    this.currentBlobURL = URL.createObjectURL(blob);

    const config: AssetViewerConfig = {
      elementId: this.containerId,
      addModelLighting: true,
      scaleModel: /<model/.test(sdf) && !/<world/.test(sdf),
      enablePBR: true,
    };

    try {
      this.viewer = new AssetViewer(config);
      // AssetViewer expects a list of file URLs. For inline SDF, we only
      // need the blob URL — but the parser looks at extension. Point it at
      // a .sdf-looking URL by appending a fake query param.
      const sdfURL = `${this.currentBlobURL}#model.sdf`;
      this.viewer.renderFromFiles([sdfURL]);
    } catch (err) {
      // AssetViewer can throw on malformed SDF. Swallow so the UI remains
      // usable; the user will see the validation errors from the backend.
      // eslint-disable-next-line no-console
      console.warn("AssetViewer failed:", err);
    }
  }

  private destroyViewer(): void {
    if (this.viewer) {
      try {
        this.viewer.destroy();
      } catch {
        // ignore
      }
      this.viewer = undefined;
    }
  }

  private revokeBlob(): void {
    if (this.currentBlobURL) {
      URL.revokeObjectURL(this.currentBlobURL);
      this.currentBlobURL = undefined;
    }
  }
}

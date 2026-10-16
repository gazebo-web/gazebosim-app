import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from "@angular/core";

import { AssetViewer, AssetViewerConfig } from "gzweb";

/**
 * Private-state hooks we reach into on the AssetViewer so we can swap
 * SDF content without destroying the WebGL context. The public API only
 * offers `renderFromFiles` (which ADDS to the scene) and `destroy` (which
 * tears the Scene down); for an auto-save-driven preview we need
 * replace semantics.
 *
 * Keeping the shape explicit rather than using `any` so a gzweb upgrade
 * that renames these fields produces a compiler error instead of silent
 * breakage.
 */
interface InternalAssetViewer {
  scene?: {
    add(o: unknown): void;
    remove(o: unknown): void;
    // Trigger an immediate render. Required for canvas snapshot capture
    // because gzweb's WebGLRenderer is created without
    // preserveDrawingBuffer — between RAFs the drawing buffer is cleared,
    // so we must render synchronously and read pixels in the same task.
    render?(deltaMs: number): void;
  };
  sdfParser?: {
    usingFilesUrls: boolean;
    enablePBR: boolean;
    // Direct in-memory parse path. Returns the Object3D synchronously
    // (it builds geometries from the XML; mesh / texture URLs inside
    // the SDF are fetched asynchronously by Three.js loaders).
    spawnFromSDF(sdf: string): unknown;
  };
  resource?: unknown;
  isScaled?: boolean;
  shouldUsePBR?: boolean;
}

/**
 * 3D viewport component for the AI Builder page.
 *
 * Renders SDF via gzweb's AssetViewer, which uses Three.js + OrbitControls
 * under the hood — mouse drag rotates, right-drag pans, wheel zooms.
 *
 * Auto-update model: the chat engine re-emits `sdf_update` SSE events
 * every time it produces a new world SDF, the parent component pushes
 * that string into `[sdf]`, and Angular triggers ngOnChanges here. We
 * keep the same AssetViewer instance across updates and swap just the
 * resource object, so the camera / grid / lighting survive and we don't
 * burn a WebGL context per auto-save.
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
  private viewerReady = false;
  private resizeObserver?: ResizeObserver;
  private readonly containerId = `ai-builder-viewport-${Math.random().toString(36).slice(2, 9)}`;

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.container.nativeElement.id = this.containerId;
    this.viewerReady = true;

    // Track container size changes (SDF/exec panel toggles, window
    // resize) and tell gzweb to update its renderer dimensions.
    // Observe outside Angular's zone so OrbitControls + render-loop
    // callbacks don't trigger a change-detection cycle per frame.
    this.ngZone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver(() => {
        // AssetViewer.resize() reads clientWidth/Height off the host
        // element and pushes into the Three.js renderer. Safe to call
        // even before the first render.
        try {
          this.viewer?.resize();
        } catch {
          /* first-tick race before setup completes */
        }
      });
      this.resizeObserver.observe(this.container.nativeElement);
    });

    if (this.sdf) this.render(this.sdf);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["sdf"] && this.viewerReady) {
      this.render(this.sdf);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.destroyViewer();
  }

  private render(sdf: string): void {
    if (!sdf || !sdf.trim()) {
      // Empty SDF → clear whatever was shown but keep the viewer alive
      // so the user doesn't see a WebGL context flicker.
      this.removeCurrentResource();
      return;
    }

    if (!this.viewer) {
      const config: AssetViewerConfig = {
        elementId: this.containerId,
        addModelLighting: true,
        // Only scale single-model previews; whole-world scenes already
        // have positions set by the SDF itself.
        scaleModel: /<model/.test(sdf) && !/<world/.test(sdf),
        enablePBR: true,
      };
      try {
        // Create outside the Angular zone — AssetViewer runs a
        // requestAnimationFrame loop that would otherwise kick CD on
        // every frame.
        this.ngZone.runOutsideAngular(() => {
          this.viewer = new AssetViewer(config);
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("AssetViewer init failed:", err);
        return;
      }
      // Ensure the renderer picks up the current container size once
      // the DOM canvas is inserted.
      try {
        this.viewer?.resize();
      } catch {
        /* ignore */
      }
    }

    // Reuse the existing viewer instance: remove the previous resource,
    // then parse the new SDF text into the same Scene. This keeps
    // OrbitControls camera state intact across auto-saves.
    this.removeCurrentResource();
    this.parseSDFIntoViewer(sdf);
  }

  private removeCurrentResource(): void {
    const v = this.viewer as unknown as InternalAssetViewer | undefined;
    if (!v || !v.scene || !v.resource) return;
    try {
      v.scene.remove(v.resource);
    } catch {
      /* scene already torn down; ignore */
    }
    v.resource = undefined;
    v.isScaled = false;
  }

  private parseSDFIntoViewer(sdf: string): void {
    const v = this.viewer as unknown as InternalAssetViewer | undefined;
    if (!v || !v.sdfParser || !v.scene) return;
    try {
      // No URL fetch path: the SDF is in memory, so let the parser
      // build the Object3D from text directly. usingFilesUrls=false
      // tells SDFParser to use its default MATERIAL_ROOT for any
      // mesh/texture references; full http URLs (e.g. Fuel includes)
      // resolve normally either way.
      v.sdfParser.usingFilesUrls = false;
      v.sdfParser.enablePBR = !!v.shouldUsePBR;
      const obj = v.sdfParser.spawnFromSDF(sdf);
      if (obj) {
        v.resource = obj;
        v.scene.add(obj);
      }
    } catch (err) {
      // SDF parser can throw on malformed input; the backend validator
      // will surface the real errors via chat, so swallow here and keep
      // the previous scene visible.
      // eslint-disable-next-line no-console
      console.warn("AssetViewer SDF parse failed:", err);
    }
  }

  /**
   * Capture the current viewport as a JPEG Blob, scaled down to a thumbnail
   * size. Returns null if no canvas is mounted yet or the SDF is empty.
   *
   * gzweb's WebGLRenderer is created with the default
   * preserveDrawingBuffer=false, so we must force a synchronous render and
   * sample the canvas pixels in the same JS task — otherwise the drawing
   * buffer is already cleared by the time toBlob runs.
   */
  async captureThumbnail(width = 320, height = 180): Promise<Blob | null> {
    if (!this.viewer) {
      // eslint-disable-next-line no-console
      console.warn("[thumbnail] no viewer; skipping capture");
      return null;
    }
    if (!this.sdf) {
      // eslint-disable-next-line no-console
      console.warn("[thumbnail] empty sdf; skipping capture");
      return null;
    }
    const sourceCanvas = this.container.nativeElement.querySelector(
      "canvas",
    ) as HTMLCanvasElement | null;
    if (!sourceCanvas) {
      // eslint-disable-next-line no-console
      console.warn("[thumbnail] no canvas in viewport container");
      return null;
    }

    // Force a synchronous render so the WebGL drawing buffer holds the
    // current scene before we sample it. gzweb's renderer has
    // preserveDrawingBuffer=false, so a delayed read returns blank pixels.
    try {
      const v = this.viewer as unknown as InternalAssetViewer;
      v.scene?.render?.(0);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[thumbnail] forced render threw:", err);
    }

    // Downscale into a 2D canvas so the upload is bounded; the source
    // canvas is sized to the viewport and can be megabytes encoded.
    const out = document.createElement("canvas");
    out.width = width;
    out.height = height;
    const ctx = out.getContext("2d");
    if (!ctx) {
      // eslint-disable-next-line no-console
      console.warn("[thumbnail] failed to get 2D context");
      return null;
    }
    try {
      ctx.drawImage(sourceCanvas, 0, 0, width, height);
    } catch (err) {
      // SecurityError fires here if the WebGL canvas was tainted by a
      // cross-origin texture without CORS headers. Log so we know that's
      // the cause rather than failing silently.
      // eslint-disable-next-line no-console
      console.warn("[thumbnail] drawImage failed (canvas tainted?):", err);
      return null;
    }
    const blob = await new Promise<Blob | null>((resolve) =>
      out.toBlob((b) => resolve(b), "image/jpeg", 0.85),
    );
    // eslint-disable-next-line no-console
    console.log(
      "[thumbnail] captured",
      blob ? `${blob.size} bytes` : "(null blob)",
      "from",
      `${sourceCanvas.width}x${sourceCanvas.height}`,
    );
    return blob;
  }

  private destroyViewer(): void {
    if (this.viewer) {
      try {
        this.viewer.destroy();
      } catch {
        /* ignore */
      }
      this.viewer = undefined;
    }
  }
}

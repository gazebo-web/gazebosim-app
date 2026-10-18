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
import {
  Box3,
  Box3Helper,
  Color,
  LineBasicMaterial,
  Object3D,
  PerspectiveCamera,
  Scene,
  Sphere,
  Vector3,
} from "three";

import { resolveProjectUris } from "./project-uris";
import { changedObjects } from "./scene-diff";

/**
 * A change the agent just made, for the viewport to point out once the
 * new world renders. `seq` increases with each change; `models` lists
 * project models whose files changed (their includes count as changed
 * even when world.sdf didn't).
 */
export interface ViewportSpotlight {
  seq: number;
  models: string[];
  at: number;
}

// How long a spotlight stays pending, waiting for its world to render.
const SPOTLIGHT_PENDING_MS = 60_000;
// Highlight timing: the camera eases toward the changed objects for
// MOVE_MS, the outline holds for HOLD_MS, then fades out over FADE_MS.
const MOVE_MS = 1500;
const HOLD_MS = 2500;
const FADE_MS = 1000;
const HIGHLIGHT_COLOR = 0xffb300;
const FOLLOW_KEY = "aiBuilder.followAgent";

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
    // The Three.js scene, camera and OrbitControls gzweb renders with.
    scene?: Scene;
    camera?: PerspectiveCamera;
    controls?: { target: Vector3 };
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
    // File URLs collected from included models, matched by file name when
    // their meshes load, and the per-URI include cache. Both are reset
    // when the signed file base changes, so stale URLs aren't reused.
    customUrls: string[];
    pendingModels: Map<string, unknown>;
    // Direct in-memory parse path. Returns the Object3D synchronously
    // (it builds geometries from the XML; mesh / texture URLs inside
    // the SDF are fetched asynchronously by Three.js loaders).
    spawnFromSDF(sdf: string): unknown;
  };
  resource?: Object3D;
  isScaled?: boolean;
  shouldUsePBR?: boolean;
}

/**
 * 3D viewport component for the AI Builder page.
 *
 * Renders SDF via gzweb's AssetViewer, which uses Three.js + OrbitControls
 * under the hood — mouse drag rotates, right-drag pans, wheel zooms.
 *
 * Auto-update model: when world.sdf changes (a `project_changed` chat
 * event, a newer head found by polling, or editor typing), the parent
 * pushes the new text into `[sdf]` and Angular triggers ngOnChanges here. We
 * keep the same AssetViewer instance across updates and swap just the
 * resource object, so the camera / grid / lighting survive and we don't
 * burn a WebGL context per auto-save.
 *
 * Watching the agent: when the parent passes a `spotlight` for a change
 * the agent made, the next world render outlines the objects that changed
 * and, while "follow" is on, eases the camera toward them.
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
  /**
   * Signed, read-only base URL for the project revision (see
   * project-uris.ts). Project models and meshes load through it.
   */
  @Input() fileBase = "";
  /** Project path of `sdf`; relative URIs resolve against its folder. */
  @Input() sdfPath = "world.sdf";
  /** The agent's latest change to point out (see ViewportSpotlight). */
  @Input() spotlight: ViewportSpotlight | null = null;

  /** Move the camera to what the agent changes; the user can turn it off. */
  follow = true;

  @ViewChild("container", { static: true })
  container!: ElementRef<HTMLDivElement>;

  private viewer?: AssetViewer;
  private viewerReady = false;
  private parsedBase = "";
  private resizeObserver?: ResizeObserver;
  // The world text last rendered, to diff the next one against.
  private lastWorld = "";
  private spotlightSeq = 0;
  private endHighlight?: () => void;
  private readonly containerId = `ai-builder-viewport-${Math.random().toString(36).slice(2, 9)}`;

  constructor(private ngZone: NgZone) {
    try {
      this.follow = localStorage.getItem(FOLLOW_KEY) !== "off";
    } catch {
      /* storage unavailable; keep the default */
    }
  }

  toggleFollow(): void {
    this.follow = !this.follow;
    try {
      localStorage.setItem(FOLLOW_KEY, this.follow ? "on" : "off");
    } catch {
      /* storage unavailable; the choice lasts this page view */
    }
  }

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
    if ((changes["sdf"] || changes["fileBase"]) && this.viewerReady) {
      this.render(this.sdf);
    }
  }

  ngOnDestroy(): void {
    this.endHighlight?.();
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
    if (this.sdfPath === "world.sdf") {
      const prev = this.lastWorld;
      this.lastWorld = sdf;
      this.showSpotlight(prev, sdf);
    }
  }

  /**
   * Point out what the pending spotlight changed between `prev` and
   * `next`. A render that shows no change (the signed base moved before
   * the new world text arrived) leaves the spotlight pending for the next.
   */
  private showSpotlight(prev: string, next: string): void {
    const s = this.spotlight;
    if (!s || s.seq <= this.spotlightSeq) return;
    if (Date.now() - s.at > SPOTLIGHT_PENDING_MS) return;
    const names = changedObjects(prev, next, s.models);
    if (!names.length) return;
    this.spotlightSeq = s.seq;
    this.ngZone.runOutsideAngular(() => this.highlight(names));
  }

  /**
   * Outline the named top-level objects and, while following, ease the
   * camera to frame them. Included models and meshes load asynchronously,
   * so their boxes are re-measured every frame until the outline fades.
   */
  private highlight(names: string[]): void {
    this.endHighlight?.();
    const v = this.viewer as unknown as InternalAssetViewer | undefined;
    const three = v?.scene?.scene;
    const camera = v?.scene?.camera;
    const controls = v?.scene?.controls;
    if (!v || !three || !camera || !controls) return;

    const want = new Set(names);
    const helpers = new Map<string, Box3Helper>();
    const canvas = this.container.nativeElement.querySelector("canvas");
    // The user taking the camera stops this highlight from moving it.
    let userMoved = false;
    const onUser = () => (userMoved = true);
    canvas?.addEventListener("pointerdown", onUser);
    canvas?.addEventListener("wheel", onUser, { passive: true });

    let frame = 0;
    let last = performance.now();
    const start = last;
    const end = () => {
      cancelAnimationFrame(frame);
      canvas?.removeEventListener("pointerdown", onUser);
      canvas?.removeEventListener("wheel", onUser);
      helpers.forEach((h) => {
        three.remove(h);
        h.geometry.dispose();
        (h.material as LineBasicMaterial).dispose();
      });
      helpers.clear();
      if (this.endHighlight === end) this.endHighlight = undefined;
    };
    this.endHighlight = end;

    const tick = (now: number) => {
      const t = now - start;
      const dt = now - last;
      last = now;
      const union = new Box3();
      for (const obj of v.resource?.children ?? []) {
        if (!want.has(obj.name)) continue;
        const box = new Box3().setFromObject(obj);
        if (box.isEmpty()) continue;
        union.union(box);
        let h = helpers.get(obj.name);
        if (!h) {
          h = new Box3Helper(box, new Color(HIGHLIGHT_COLOR));
          h.name = "AI_BUILDER_HIGHLIGHT";
          const m = h.material as LineBasicMaterial;
          m.transparent = true;
          m.depthTest = false;
          h.renderOrder = 999;
          three.add(h);
          helpers.set(obj.name, h);
        } else {
          h.box.copy(box);
        }
      }
      const fade = t < HOLD_MS ? 1 : Math.max(0, 1 - (t - HOLD_MS) / FADE_MS);
      const pulse = 0.75 + 0.25 * Math.sin(t / 150);
      helpers.forEach(
        (h) => ((h.material as LineBasicMaterial).opacity = fade * pulse),
      );
      if (this.follow && !userMoved && t < MOVE_MS && !union.isEmpty()) {
        easeCamera(camera, controls.target, union, dt);
      }
      if (t < HOLD_MS + FADE_MS) {
        frame = requestAnimationFrame(tick);
      } else {
        end();
      }
    };
    frame = requestAnimationFrame(tick);
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
      // The SDF is parsed from memory. Project references become signed
      // URLs; with usingFilesUrls the parser loads meshes by URL, looking
      // up included models' files (Fuel or project) in customUrls.
      if (this.fileBase !== this.parsedBase) {
        v.sdfParser.customUrls = [];
        v.sdfParser.pendingModels = new Map();
        this.parsedBase = this.fileBase;
      }
      v.sdfParser.usingFilesUrls = true;
      v.sdfParser.enablePBR = !!v.shouldUsePBR;
      const obj = v.sdfParser.spawnFromSDF(
        resolveProjectUris(sdf, this.fileBase, this.sdfPath),
      );
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
    this.endHighlight?.();
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

/**
 * Move the camera a step (for `dtMs`) toward framing `box`: the box's
 * center becomes the orbit target, at a distance that fits the box, from
 * the current viewing direction but no flatter than about 20 degrees.
 */
function easeCamera(
  camera: PerspectiveCamera,
  target: Vector3,
  box: Box3,
  dtMs: number,
): void {
  const sphere = box.getBoundingSphere(new Sphere());
  const halfFov = ((camera.fov || 60) * Math.PI) / 360;
  const distance = Math.max((sphere.radius / Math.sin(halfFov)) * 1.2, 3);
  const dir = camera.position.clone().sub(target).normalize();
  if (dir.lengthSq() === 0) dir.set(-1, -1, 1).normalize();
  if (dir.z < 0.35) {
    dir.z = 0.35;
    dir.normalize();
  }
  const goal = sphere.center.clone().addScaledVector(dir, distance);
  const k = 1 - Math.exp(-dtMs / 250);
  target.lerp(sphere.center, k);
  camera.position.lerp(goal, k);
}

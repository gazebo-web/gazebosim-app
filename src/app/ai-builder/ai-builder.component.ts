import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Observable, Subject, interval, of, switchMap, takeUntil } from "rxjs";

import { AuthService } from "../auth/auth.service";
import {
  ASSET_ACCEPT,
  AiBuilderProject,
  AiBuilderService,
  ChatAttachment,
  ChatEvent,
  ChatMessage,
  LLMKey,
  ModelInfo,
  ProjectAsset,
  ProjectVersion,
} from "./ai-builder.service";
import {
  GazeboConnectionDialogComponent,
  GazeboConnectionDialogData,
} from "./gazebo-connection-dialog/gazebo-connection-dialog.component";
import {
  GitHubExportDialogComponent,
  GitHubExportResult,
} from "./github-export-dialog/github-export-dialog.component";
import { SaveVersionDialogComponent } from "./save-version-dialog/save-version-dialog.component";
import {
  AiBuilderViewportComponent,
  ViewportSpotlight,
} from "./viewport/ai-builder-viewport.component";

interface ChatLogEntry {
  role: "user" | "assistant" | "tool";
  text: string;
  toolName?: string;
  /** Project files sent with a user message. */
  attachments?: ChatAttachment[];
  // UI-only state: whether the entry is expanded to show its full text.
  // Defaults to false; the first line is always shown as a summary and
  // multi-line entries render a chevron that flips this flag.
  expanded?: boolean;
}

@Component({
  selector: "ai-builder",
  templateUrl: "./ai-builder.component.html",
  styleUrls: ["./ai-builder.component.scss"],
  standalone: false,
})
export class AiBuilderComponent implements OnInit, OnDestroy, AfterViewChecked {
  private destroy$ = new Subject<void>();
  project?: AiBuilderProject;
  log: ChatLogEntry[] = [];
  @ViewChild("messagesList") private messagesList?: ElementRef<HTMLDivElement>;
  @ViewChild(AiBuilderViewportComponent)
  private viewport?: AiBuilderViewportComponent;
  @ViewChild("rightColumn") private rightColumn?: ElementRef<HTMLDivElement>;

  // Prompt history for shell-style up/down arrow navigation in the
  // chat input. `promptHistory` grows append-only as the user sends
  // messages this session. `historyCursor` is -1 when not navigating
  // (the user is composing fresh text); positive values are offsets
  // back from the most recent prompt — 0 = newest, 1 = previous, ...
  // `pendingDraft` snapshots whatever the user had typed before they
  // first pressed Up, so pressing Down past the newest prompt restores
  // their in-progress text rather than a blank input.
  private promptHistory: string[] = [];
  private historyCursor = -1;
  private pendingDraft = "";

  // SDF panel resize state. `sdfPanelHeightPx === null` means "use the
  // default flex basis (30%)"; once the user drags the splitter we
  // switch to a pixel-precise height. Dragging persists for the life of
  // the page only — we don't pin a per-project preference yet.
  sdfPanelHeightPx: number | null = null;
  splitterDragging = false;
  private splitterStart?: {
    startY: number;
    startHeight: number;
    columnHeight: number;
  };
  // Signature of the last chat-log snapshot we auto-scrolled to the
  // bottom for. Compared on every ngAfterViewChecked so streaming token
  // updates (which grow `currentAssistant` without touching `log`) and
  // new entries both trigger the "newest above the input box" behavior.
  private lastScrollKey = "";
  currentAssistant = "";
  draftMessage = "";
  sending = false;
  // The left column shows the chat or the project's files.
  leftTab: "chat" | "files" = "chat";
  // Project files to send with the next message, and upload progress
  // (0-1) for files dropped, pasted or picked in the chat.
  pendingAttachments: ProjectAsset[] = [];
  attachProgress: number | null = null;
  chatDragging = false;
  readonly assetAccept = ASSET_ACCEPT;
  // Signed base URL for the project's file thumbnails.
  assetsBase = "";
  worldSDF = "";
  showSDF = false;
  showHistory = false;
  showExecution = false;

  // world.sdf state. worldRev is the revision the editor's text is based
  // on (sent as base_rev on save, so fuel-server rejects a save that would
  // overwrite an agent's newer edit). worldDirty means the editor holds
  // edits not yet written. lastSavedAt drives the "Saved Xs ago" chip.
  private worldRev = "";
  worldDirty = false;
  // Signed base URL the viewport loads project models and meshes from,
  // for fileBaseRev; refreshed when the head moves or it nears expiry.
  fileBase = "";
  private fileBaseRev = "";
  private fileBaseExpires = 0;
  lastSavedAt: number | null = null;
  // Set when the agent changed the project during a turn; the thumbnail
  // is refreshed once when the turn ends rather than after every edit.
  private projectChangedThisTurn = false;
  // The agent's latest change, for the viewport to point out.
  spotlight: ViewportSpotlight | null = null;

  // The running turn and the AbortController of the stream following it.
  // The turn runs on the server, so closing the stream doesn't stop it:
  // the stop button cancels the turn, and a reloaded page follows it.
  private currentTurn?: string;
  private currentAbort?: AbortController;

  // LLM selection: list of providers the user has keys for, and the
  // available models for the currently-selected provider.
  availableKeys: LLMKey[] = [];
  selectedProvider = "";
  availableModels: ModelInfo[] = [];
  selectedModel = "";
  loadingModels = false;

  constructor(
    private route: ActivatedRoute,
    private service: AiBuilderService,
    private auth: AuthService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const id = params.get("projectId");
      if (id) this.loadProject(id);
    });
    // Notice edits made outside this page (an external agent working
    // through MCP, another tab). During a chat turn project_changed
    // events cover it instead.
    interval(5000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.pollHead());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // If the user destroys the page mid-drag (e.g. navigating away),
    // make sure we don't leave document-level listeners dangling.
    this.endSplitterDrag();
    // Leaving the page stops following the turn, not the turn itself.
    this.currentAbort?.abort();
  }

  /**
   * Handle Up/Down arrow key navigation through the user's prompt
   * history, shell-style. Up moves further back through previous
   * prompts, Down moves forward toward the in-progress draft. We only
   * intercept the key when the user is at the top (Up) / bottom (Down)
   * of the textarea so that mid-message editing of multi-line drafts
   * still works with the cursor keys.
   *
   * Important: this returns `void`. Angular's template event binding
   * calls `event.preventDefault()` when the handler expression
   * evaluates to `false`, which would silently swallow every regular
   * keystroke. Always-undefined return keeps typing working.
   */
  onChatKeyDown(event: KeyboardEvent): void {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    const ta = event.target as HTMLTextAreaElement | null;
    if (!ta) return;
    if (event.key === "ArrowUp") {
      // Only swallow when the cursor is on the first line of the
      // textarea — otherwise the user is editing a multi-line draft
      // and Up means "move up one line".
      if (!isCursorOnFirstLine(ta)) return;
      if (this.promptHistory.length === 0) return;
      if (this.historyCursor === -1) {
        // Snapshot the user's in-progress text so Down can restore it.
        this.pendingDraft = this.draftMessage;
        this.historyCursor = 0;
      } else if (this.historyCursor < this.promptHistory.length - 1) {
        this.historyCursor++;
      } else {
        event.preventDefault();
        return; // already at the oldest entry; absorb the key
      }
      this.draftMessage =
        this.promptHistory[this.promptHistory.length - 1 - this.historyCursor];
      // Move caret to the end so Down isn't immediately ambiguous and
      // so the user sees the full prompt without scrolling.
      queueMicrotask(() => {
        const len = this.draftMessage.length;
        ta.setSelectionRange(len, len);
      });
      event.preventDefault();
      return;
    }
    // ArrowDown
    if (this.historyCursor === -1) return;
    if (!isCursorOnLastLine(ta)) return;
    this.historyCursor--;
    if (this.historyCursor === -1) {
      this.draftMessage = this.pendingDraft;
      this.pendingDraft = "";
    } else {
      this.draftMessage =
        this.promptHistory[this.promptHistory.length - 1 - this.historyCursor];
    }
    queueMicrotask(() => {
      const len = this.draftMessage.length;
      ta.setSelectionRange(len, len);
    });
    event.preventDefault();
  }

  /**
   * Begin resizing the SDF panel. We capture the splitter's starting
   * geometry once, then track movement on the document so the cursor
   * is free to leave the splitter strip while still updating the
   * panel height.
   */
  onSplitterMouseDown(event: MouseEvent): void {
    if (!this.rightColumn) return;
    event.preventDefault();
    const column = this.rightColumn.nativeElement;
    const panel = column.querySelector(".sdf-panel") as HTMLElement | null;
    if (!panel) return;
    this.splitterStart = {
      startY: event.clientY,
      startHeight: panel.getBoundingClientRect().height,
      columnHeight: column.getBoundingClientRect().height,
    };
    this.splitterDragging = true;
    document.addEventListener("mousemove", this.onSplitterMouseMove);
    document.addEventListener("mouseup", this.onSplitterMouseUp);
    // Stop the iframe / textarea / viewport canvas from grabbing the
    // pointer while the user is dragging. CSS `user-select: none` on
    // the body during drag also prevents accidental text selection.
    document.body.classList.add("ai-builder-splitter-active");
  }

  private onSplitterMouseMove = (event: MouseEvent): void => {
    if (!this.splitterStart) return;
    // Dragging up ⇒ negative delta in screen coords ⇒ panel grows.
    const dy = this.splitterStart.startY - event.clientY;
    const minPanel = 120;
    // Reserve at least 200px for the viewport so the user can't drag
    // the splitter past the top of the column.
    const maxPanel = Math.max(minPanel, this.splitterStart.columnHeight - 200);
    const next = Math.max(
      minPanel,
      Math.min(maxPanel, this.splitterStart.startHeight + dy),
    );
    this.sdfPanelHeightPx = next;
  };

  private onSplitterMouseUp = (): void => {
    this.endSplitterDrag();
  };

  private endSplitterDrag(): void {
    document.removeEventListener("mousemove", this.onSplitterMouseMove);
    document.removeEventListener("mouseup", this.onSplitterMouseUp);
    document.body.classList.remove("ai-builder-splitter-active");
    this.splitterDragging = false;
    this.splitterStart = undefined;
  }

  private username(): string {
    return (
      (this.auth as unknown as { userProfile?: { username?: string } })
        .userProfile?.username || ""
    );
  }

  private prefsKey(): string {
    return this.project
      ? `ai-builder.llm-prefs.${this.project.id}`
      : "ai-builder.llm-prefs.default";
  }

  private loadAvailableKeys(): void {
    const user = this.username();
    if (!user) return;
    this.service.listLLMKeys(user).subscribe({
      next: (keys) => {
        this.availableKeys = keys || [];
        this.restoreSelection();
      },
      error: () => {
        // No keys / auth issue — user will see an error on first send.
        this.availableKeys = [];
      },
    });
  }

  private restoreSelection(): void {
    let provider = "";
    let model = "";
    try {
      const raw = localStorage.getItem(this.prefsKey());
      if (raw) {
        const parsed = JSON.parse(raw);
        provider = parsed.provider || "";
        model = parsed.model || "";
      }
    } catch {
      // ignore corrupt localStorage entries
    }
    const valid = this.availableKeys.some((k) => k.provider === provider);
    if (!valid) {
      provider = this.availableKeys[0]?.provider || "";
      model = "";
    }
    this.selectedProvider = provider;
    if (provider) {
      this.loadModelsFor(provider, model);
    }
  }

  private persistSelection(): void {
    try {
      localStorage.setItem(
        this.prefsKey(),
        JSON.stringify({
          provider: this.selectedProvider,
          model: this.selectedModel,
        }),
      );
    } catch {
      // ignore quota errors
    }
  }

  onProviderChange(provider: string): void {
    this.selectedProvider = provider;
    this.selectedModel = "";
    this.loadModelsFor(provider, "");
  }

  onModelChange(model: string): void {
    this.selectedModel = model;
    this.persistSelection();
  }

  modelLabel(id: string): string {
    const hit = this.availableModels.find((m) => m.id === id);
    return hit?.display_name || id;
  }

  // --- Chat entry summary / expand ----------------------------------
  //
  // The messages list shows one line per entry (the first line of its
  // text, truncated if long). Multi-line entries — long assistant
  // replies, fenced SDF blocks, tool JSON — get a chevron that toggles
  // an expanded view rendering the full body.

  /** Maximum characters to show in the collapsed summary. */
  private static readonly SUMMARY_CHAR_LIMIT = 160;

  /** First non-empty line of the entry, clipped to SUMMARY_CHAR_LIMIT. */
  entrySummary(entry: ChatLogEntry): string {
    const lines = entry.text.split(/\r?\n/);
    let first = "";
    for (const line of lines) {
      if (line.trim().length > 0) {
        first = line;
        break;
      }
    }
    if (!first) return "";
    if (first.length > AiBuilderComponent.SUMMARY_CHAR_LIMIT) {
      return first.slice(0, AiBuilderComponent.SUMMARY_CHAR_LIMIT) + "…";
    }
    return first;
  }

  /** True if the entry has more content than its summary reveals. */
  isEntryExpandable(entry: ChatLogEntry): boolean {
    if (!entry.text) return false;
    if (entry.text.includes("\n")) return true;
    return entry.text.length > AiBuilderComponent.SUMMARY_CHAR_LIMIT;
  }

  /** Toggle the entry's expanded flag. Called from the template. */
  toggleEntry(entry: ChatLogEntry): void {
    if (!this.isEntryExpandable(entry)) return;
    entry.expanded = !entry.expanded;
  }

  ngAfterViewChecked(): void {
    // Keep the newest message pinned just above the chat box. We key the
    // auto-scroll on (log length | in-flight streaming length) so both
    // "new entry arrived" and "streaming text grew" trigger it, while
    // idle ticks that only re-render the same content don't.
    const key = `${this.log.length}|${this.currentAssistant.length}`;
    if (key === this.lastScrollKey) return;
    this.lastScrollKey = key;
    this.scrollMessagesToBottom();
  }

  private scrollMessagesToBottom(): void {
    const el = this.messagesList?.nativeElement;
    if (!el) return;
    // Use requestAnimationFrame so the scroll happens after Angular has
    // committed the DOM change we're reacting to.
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }

  private loadModelsFor(provider: string, preferModel: string): void {
    if (!provider) {
      this.availableModels = [];
      this.selectedModel = "";
      return;
    }
    this.loadingModels = true;
    this.service.listModels(provider).subscribe({
      next: ({ models }) => {
        this.availableModels = models || [];
        const ids = this.availableModels.map((m) => m.id);
        if (preferModel && ids.includes(preferModel)) {
          this.selectedModel = preferModel;
        } else {
          this.selectedModel = ids[0] || "";
        }
        this.loadingModels = false;
        this.persistSelection();
      },
      error: (err) => {
        this.availableModels = [];
        this.selectedModel = "";
        this.loadingModels = false;
        const detail = err?.error?.error || err?.message || "unknown error";
        this.snack.open(
          `Could not list ${provider} models: ${detail}`,
          "Dismiss",
          { duration: 6000 },
        );
      },
    });
  }

  private loadProject(id: string): void {
    this.service.getProject(id).subscribe({
      next: (p) => {
        this.project = p;
        this.service.assetsBase(p.id).subscribe({
          next: (b) => (this.assetsBase = b),
          error: () => {
            // Thumbnails fall back to icons.
          },
        });
        this.loadHistory();
        this.loadLatestVersion();
        this.loadAvailableKeys();
      },
      error: (err) => this.notifyError(err, "Load project"),
    });
  }

  private loadHistory(): void {
    if (!this.project) return;
    this.service.getChatHistory(this.project.id).subscribe({
      next: (session) => {
        this.log = session.messages
          .filter(
            (m) =>
              m.role === "user" ||
              m.role === "assistant" ||
              m.role === "tool_result",
          )
          .map((m) => this.toLogEntry(m));
        const turn = session.active_turn;
        if (turn && !this.sending) {
          this.log.push({ role: "user", text: turn.message });
          this.followTurn(turn.turn_id);
        }
      },
      error: () => {
        // Ignore — new sessions may have no history.
      },
    });
  }

  private toLogEntry(m: ChatMessage): ChatLogEntry {
    if (m.role === "tool_result") {
      return { role: "tool", text: m.content, toolName: m.tool_name };
    }
    return {
      role: m.role === "user" ? "user" : "assistant",
      text: m.content,
      attachments: m.attachments,
    };
  }

  // --- Attaching project files to a message ---

  // Files whose thumbnail failed to load (none was made); they show an icon.
  private noThumb = new Set<string>();

  attachmentThumb(a: { id: string; views?: string[] }): string | null {
    if (!this.assetsBase || this.noThumb.has(a.id)) return null;
    if (a.views && !a.views.includes("thumb.jpg")) return null;
    return `${this.assetsBase}/${a.id}/thumb.jpg`;
  }

  thumbFailed(id: string): void {
    this.noThumb.add(id);
  }

  attachmentIcon(kind: string): string {
    return (
      {
        document: "picture_as_pdf",
        drawing: "architecture",
        mesh: "view_in_ar",
        texture: "texture",
      }[kind] || "image"
    );
  }

  /** Attach an already-uploaded file (from the Files panel). */
  attachAsset(a: ProjectAsset): void {
    this.leftTab = "chat";
    if (!this.pendingAttachments.some((x) => x.id === a.id)) {
      this.pendingAttachments.push(a);
    }
  }

  removeAttachment(a: ProjectAsset): void {
    this.pendingAttachments = this.pendingAttachments.filter(
      (x) => x.id !== a.id,
    );
  }

  onAttachPick(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = "";
    this.uploadAttachments(files);
  }

  onChatDragOver(ev: DragEvent): void {
    if (!ev.dataTransfer?.types.includes("Files")) return;
    ev.preventDefault();
    this.chatDragging = true;
  }

  onChatDrop(ev: DragEvent): void {
    ev.preventDefault();
    this.chatDragging = false;
    this.uploadAttachments(Array.from(ev.dataTransfer?.files ?? []));
  }

  /** Pasted images (screenshots) become attachments. */
  onChatPaste(ev: ClipboardEvent): void {
    const files = Array.from(ev.clipboardData?.files ?? []);
    if (!files.length) return;
    ev.preventDefault();
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    this.uploadAttachments(
      files.map((f, i) =>
        f.name && f.name !== "image.png"
          ? f
          : new File([f], `pasted-${stamp}${i ? "-" + i : ""}.png`, {
              type: f.type,
            }),
      ),
    );
  }

  private async uploadAttachments(files: File[]): Promise<void> {
    if (!this.project || !files.length || this.attachProgress !== null) return;
    this.attachProgress = 0;
    try {
      const added = await this.service.uploadAssetsWithProgress(
        this.project.id,
        files,
        (f) => (this.attachProgress = f),
      );
      for (const a of added) this.attachAsset(a);
    } catch (err) {
      this.snack.open(
        `Upload failed: ${this.service.assetError(err)}`,
        "Dismiss",
        { duration: 8000 },
      );
    } finally {
      this.attachProgress = null;
    }
  }

  /**
   * Load world.sdf at `rev` (default: the project's head) into the viewport
   * and editor, discarding unsaved editor changes. Content that hasn't
   * changed is not reassigned, so polling and our own thumbnail commits
   * don't re-render the scene.
   */
  private loadLatestVersion(rev?: string): void {
    if (!this.project) return;
    const name = this.project.id;
    const at = rev || this.project.head_rev || "tip";
    this.refreshFileBase(at === "tip" ? "" : at);
    this.service.getProjectFile(name, at, "world.sdf").subscribe({
      next: (sdf) => {
        this.worldRev = at === "tip" ? "" : at;
        this.worldDirty = false;
        if (sdf !== this.worldSDF) this.worldSDF = sdf;
      },
      error: (err) => {
        if (err?.status === 404) {
          // No world.sdf yet: the agent creates it on the first build.
          this.worldRev = at === "tip" ? "" : at;
          return;
        }
        this.notifyError(err, "Load world.sdf");
      },
    });
  }

  /**
   * Point the viewport at signed URLs for `rev` (default head), unless the
   * current ones are for that revision and not about to expire.
   */
  private refreshFileBase(rev: string): void {
    if (!this.project) return;
    const fresh = Date.now() < this.fileBaseExpires - 5 * 60_000;
    if (fresh && rev && rev === this.fileBaseRev) return;
    this.service.getFileUrl(this.project.id, rev || undefined).subscribe({
      next: (u) => {
        this.fileBaseRev = u.rev;
        this.fileBaseExpires = Date.parse(u.expires_at);
        if (u.base_url !== this.fileBase) this.fileBase = u.base_url;
      },
      error: () => {
        // A project with no commits yet has nothing to sign; the next
        // head change retries.
      },
    });
  }

  /** Reload the world when the project's head moved since we last looked. */
  private pollHead(): void {
    if (this.project && Date.now() > this.fileBaseExpires - 5 * 60_000) {
      this.refreshFileBase(this.fileBaseRev);
    }
    if (!this.project || this.sending || this.worldDirty || document.hidden) {
      return;
    }
    const known = this.project.head_rev;
    this.service.getProject(this.project.id).subscribe({
      next: (p) => {
        if (!p.head_rev || p.head_rev === known) return;
        this.project = p;
        this.loadLatestVersion(p.head_rev);
      },
      error: () => {
        // Transient; try again on the next tick.
      },
    });
  }

  /** The SDF editor changed the text: keep it until Save writes it. */
  onEditorChange(sdf: string): void {
    this.worldSDF = sdf;
    this.worldDirty = true;
  }

  canSend(): boolean {
    return (
      (!!this.draftMessage.trim() || this.pendingAttachments.length > 0) &&
      this.attachProgress === null
    );
  }

  async sendMessage(): Promise<void> {
    if (!this.project || !this.canSend() || this.sending) return;
    const text = this.draftMessage.trim();
    const attachments = this.pendingAttachments;
    this.draftMessage = "";
    this.pendingAttachments = [];
    this.sending = true;
    this.log.push({
      role: "user",
      text,
      attachments: attachments.map((a) => ({
        id: a.id,
        name: a.name,
        kind: a.kind,
      })),
    });
    // Append to prompt history (skip exact duplicates of the most
    // recent entry, like bash's HISTCONTROL=ignoredups). Reset the
    // cursor so the next Up press starts from the new newest entry.
    if (text && this.promptHistory[this.promptHistory.length - 1] !== text) {
      this.promptHistory.push(text);
    }
    this.historyCursor = -1;
    this.pendingDraft = "";
    this.currentAssistant = "";

    const token = localStorage.getItem("token") || "dev-user";
    const controller = new AbortController();
    await this.consume(
      this.service.streamChat(this.project.id, text, token, {
        provider: this.selectedProvider || undefined,
        model: this.selectedModel || undefined,
        attachments: attachments.map((a) => a.id),
        signal: controller.signal,
        onTurn: (id) => (this.currentTurn = id),
      }),
      controller,
    );
  }

  /** Show a turn that was already running when the page loaded. */
  private async followTurn(turnId: string): Promise<void> {
    if (!this.project) return;
    this.sending = true;
    this.currentAssistant = "";
    this.currentTurn = turnId;
    const token = localStorage.getItem("token") || "dev-user";
    const controller = new AbortController();
    await this.consume(
      this.service.followChat(this.project.id, turnId, token, {
        signal: controller.signal,
      }),
      controller,
    );
  }

  /** Show a turn's events until it ends or the stream is aborted. */
  private async consume(
    stream: AsyncGenerator<ChatEvent>,
    controller: AbortController,
  ): Promise<void> {
    this.currentAbort = controller;
    this.projectChangedThisTurn = false;
    try {
      for await (const ev of stream) {
        this.handleEvent(ev);
      }
    } catch (err: any) {
      // AbortError is a deliberate user cancellation — don't show a
      // toast for it. Anything else is a real failure.
      if (
        err?.name !== "AbortError" &&
        !(err instanceof DOMException && err.name === "AbortError")
      ) {
        this.showChatError(err?.message || "stream failed");
      }
    } finally {
      if (this.currentAssistant) {
        this.log.push({ role: "assistant", text: this.currentAssistant });
        this.currentAssistant = "";
      }
      this.sending = false;
      this.currentAbort = undefined;
      this.currentTurn = undefined;
      if (this.projectChangedThisTurn) this.refreshThumbnail();
    }
  }

  /**
   * Stop the running turn. The server cancels it and its stream ends with
   * a cancelled done event. Without a turn id yet, just drop the stream.
   */
  stopMessage(): void {
    if (!this.project || !this.currentTurn) {
      this.currentAbort?.abort();
      return;
    }
    this.service.cancelChat(this.project.id, this.currentTurn).subscribe({
      error: () => this.currentAbort?.abort(),
    });
  }

  private handleEvent(ev: ChatEvent): void {
    switch (ev.type) {
      case "text":
        if (ev.text) this.currentAssistant += ev.text;
        break;
      case "tool_call":
        this.log.push({
          role: "tool",
          text: `→ calling ${ev.tool}(${JSON.stringify(ev.input || {})})`,
          toolName: ev.tool,
        });
        break;
      case "tool_result":
        this.log.push({
          role: "tool",
          text: `← ${ev.tool} returned`,
          toolName: ev.tool,
        });
        break;
      case "project_changed":
        // The agent wrote a project file; it is already committed.
        this.lastSavedAt = Date.now();
        this.projectChangedThisTurn = true;
        if (this.project && ev.rev) {
          this.project = { ...this.project, head_rev: ev.rev };
        }
        // A project model's files changed (not just its source code): the
        // world shows it through an include, so reload and point it out.
        const model = /^models\/([^/]+)\/(?!source\/)/.exec(ev.path || "")?.[1];
        if (model && !this.worldDirty) {
          this.spotlightChange([model]);
          this.loadLatestVersion(ev.rev);
        } else if (ev.path === "world.sdf") {
          if (this.worldDirty) {
            this.snack
              .open(
                "The agent changed world.sdf while you have unsaved editor changes. Saving them will be refused until you reload.",
                "Reload",
                { duration: 10000 },
              )
              .onAction()
              .subscribe(() => this.loadLatestVersion());
          } else {
            this.spotlightChange([]);
            this.loadLatestVersion(ev.rev);
          }
        }
        break;
      case "error":
        this.showChatError(ev.error || "error");
        break;
      case "done":
        if (ev.status === "cancelled") {
          this.log.push({ role: "tool", text: "Stopped." });
        } else if (ev.status === "failed" && ev.error) {
          this.showChatError(ev.error);
        }
        break;
    }
  }

  private spotlightChange(models: string[]): void {
    this.spotlight = {
      seq: (this.spotlight?.seq || 0) + 1,
      models,
      at: Date.now(),
    };
  }

  private showChatError(message: string): void {
    this.notifyError(message);
  }

  /**
   * Single funnel for any user-facing error in the AI Builder page.
   * Always raises a toast — per the UX rule that errors must be
   * visible above the fold rather than tucked into an inline banner.
   * Pass `prefix` (e.g. "Save") to scope the message; we'll prepend
   * it to whatever HTTP / RPC / engine error string we got back.
   */
  notifyError(detail: unknown, prefix?: string): void {
    const text = this.formatError(detail);
    const msg = prefix ? `${prefix}: ${text}` : text;
    this.snack.open(msg, "Dismiss", { duration: 6000 });
    // eslint-disable-next-line no-console
    console.warn("ai-builder error:", msg, detail);
  }

  private formatError(err: unknown): string {
    if (err == null) return "unknown error";
    if (typeof err === "string") return err;
    const e = err as {
      status?: number;
      error?: { error?: string } | string;
      message?: string;
    };
    // Backend error envelope (`{error: "msg"}` from writeError) wins
    // because it carries the actually-actionable detail.
    if (e?.error && typeof e.error === "object" && e.error.error) {
      return e.error.error;
    }
    if (typeof e?.error === "string" && e.error) {
      return e.error;
    }
    if (e?.message) return e.message;
    try {
      return JSON.stringify(err);
    } catch {
      return String(err);
    }
  }

  /**
   * Human-readable "saved N seconds ago" used by the header chip. Pure
   * formatting; called from the template. Returns empty string until the
   * first successful save so nothing renders.
   */
  autoSavedLabel(): string {
    if (!this.lastSavedAt) return "";
    const secs = Math.max(
      1,
      Math.round((Date.now() - this.lastSavedAt) / 1000),
    );
    if (secs < 60) return `Saved ${secs}s ago`;
    const mins = Math.round(secs / 60);
    if (mins < 60) return `Saved ${mins}m ago`;
    const hrs = Math.round(mins / 60);
    return `Saved ${hrs}h ago`;
  }

  toggleSDF(): void {
    this.showSDF = !this.showSDF;
  }

  toggleHistory(): void {
    this.showHistory = !this.showHistory;
  }

  toggleExecution(): void {
    this.showExecution = !this.showExecution;
  }

  /**
   * Save a labeled version. Unsaved editor changes are written first,
   * based on the revision they were loaded from; fuel-server refuses the
   * write (409) if the agent or another session changed world.sdf since.
   */
  saveVersion(): void {
    if (!this.project) return;
    const ref = this.dialog.open<
      SaveVersionDialogComponent,
      unknown,
      string | undefined
    >(SaveVersionDialogComponent, { width: "440px" });
    ref.afterClosed().subscribe((msg) => {
      if (msg === undefined || !this.project) return;
      const name = this.project.id;
      const write$: Observable<unknown> = this.worldDirty
        ? this.service.writeProjectFile(name, "world.sdf", this.worldSDF, {
            baseRev: this.worldRev,
          })
        : of(null);
      write$
        .pipe(switchMap(() => this.service.checkpoint(name, msg)))
        .subscribe({
          next: (res) => {
            this.worldDirty = false;
            this.worldRev = res.rev;
            if (this.project)
              this.project = { ...this.project, head_rev: res.rev };
            this.lastSavedAt = Date.now();
            this.snack.open("Saved.", "Dismiss", { duration: 2000 });
            this.refreshThumbnail();
          },
          error: (err) => {
            if (err?.status === 409) {
              this.snack
                .open(
                  "world.sdf changed since you loaded it (probably the agent). Reload to get the latest; your unsaved edits will be discarded.",
                  "Reload",
                  { duration: 10000 },
                )
                .onAction()
                .subscribe(() => this.loadLatestVersion());
              return;
            }
            this.notifyError(err, "Save");
          },
        });
    });
  }

  /**
   * Capture the current 3D viewport and upload it as the project's
   * thumbnail. Best-effort — if the viewer hasn't mounted, the SDF is
   * empty, or the upload fails, we just log and move on. Cards fall
   * back to the placeholder image so the UI never blocks on this.
   */
  private async refreshThumbnail(): Promise<void> {
    if (!this.project) {
      // eslint-disable-next-line no-console
      console.warn("[thumbnail] no project; skipping");
      return;
    }
    if (!this.viewport) {
      // eslint-disable-next-line no-console
      console.warn("[thumbnail] no viewport ViewChild bound");
      return;
    }
    try {
      const blob = await this.viewport.captureThumbnail();
      if (!blob) return;
      // eslint-disable-next-line no-console
      console.log(
        `[thumbnail] uploading ${blob.size} bytes to project ${this.project.id}`,
      );
      this.service.uploadThumbnail(this.project.id, blob).subscribe({
        next: (resp) => {
          // eslint-disable-next-line no-console
          console.log("[thumbnail] uploaded; version", resp?.version);
        },
        error: (err) => {
          // eslint-disable-next-line no-console
          console.warn("[thumbnail] upload failed:", err);
        },
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[thumbnail] capture failed:", err);
    }
  }

  clearChat(): void {
    if (!this.project) return;
    if (!confirm("Clear the entire chat history for this project?")) return;
    this.service.clearChatHistory(this.project.id).subscribe(() => {
      this.log = [];
    });
  }

  restoreVersion(v: ProjectVersion): void {
    if (!this.project) return;
    // Fetch the world.sdf at the chosen version and drop it into the
    // editor. Committing it back as a new version is a separate Save.
    this.service
      .getProjectFile(this.project.id, String(v.version), "world.sdf")
      .subscribe({
        next: (sdf) => {
          this.worldSDF = sdf;
          this.worldDirty = true;
          this.snack.open(
            `Restored v${v.version} into editor. Save to lock it in as a new version.`,
            "Dismiss",
            { duration: 4000 },
          );
        },
        error: (err) => this.notifyError(err, `Restore v${v.version}`),
      });
  }

  configureGazebo(): void {
    if (!this.project) return;
    const ref = this.dialog.open<
      GazeboConnectionDialogComponent,
      GazeboConnectionDialogData,
      GazeboConnectionDialogData | null
    >(GazeboConnectionDialogComponent, {
      width: "520px",
      data: {
        url: this.project.gazebo_ws_url || "",
        key: this.project.gazebo_ws_key || "",
      },
    });
    ref.afterClosed().subscribe((result) => {
      if (result === null || !this.project) return;
      this.service
        .updateProject(this.project.id, {
          gazebo_ws_url: result.url,
          gazebo_ws_key: result.key,
        })
        .subscribe({
          next: (p) => {
            this.project = p;
            this.snack.open(
              result.url ? "Gazebo connection saved." : "Disconnected.",
              "Dismiss",
              { duration: 2000 },
            );
          },
          error: (err) => this.notifyError(err, "Save Gazebo connection"),
        });
    });
  }

  downloadZip(): void {
    if (!this.project) return;
    const name = this.project.id;
    this.service.exportZip(name).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${name}.zip`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: (err) => this.notifyError(err, "Download ZIP"),
    });
  }

  pushToGitHub(): void {
    if (!this.project) return;
    const ref = this.dialog.open(GitHubExportDialogComponent, {
      width: "520px",
      data: { defaultRepo: this.project.github_repo || "" },
    });
    ref.afterClosed().subscribe((result: GitHubExportResult | null) => {
      if (!result || !this.project) return;
      this.service.exportToGitHub(this.project.id, result).subscribe({
        next: (resp) => {
          this.snack.open(
            `Pushed ${resp.paths.length} files to ${resp.repo}.`,
            "Dismiss",
            { duration: 4000 },
          );
          // Remember the repo for next time.
          if (this.project) {
            this.service
              .updateProject(this.project.id, { github_repo: result.repo })
              .subscribe((p) => (this.project = p));
          }
        },
        error: (err) => this.notifyError(err, "Push to GitHub"),
      });
    });
  }

  get gazeboStatusLabel(): string {
    if (!this.project?.gazebo_ws_url) return "Not connected";
    return this.project.gazebo_ws_url;
  }
}

// True when the textarea's caret sits on the visually first line of
// content. Used so Up arrow only triggers history when the user isn't
// editing the middle of a multi-line draft.
function isCursorOnFirstLine(ta: HTMLTextAreaElement): boolean {
  const pos = ta.selectionStart ?? 0;
  return ta.value.lastIndexOf("\n", pos - 1) === -1;
}

// True when the caret is on the last line of textarea content.
function isCursorOnLastLine(ta: HTMLTextAreaElement): boolean {
  const pos = ta.selectionStart ?? 0;
  return ta.value.indexOf("\n", pos) === -1;
}

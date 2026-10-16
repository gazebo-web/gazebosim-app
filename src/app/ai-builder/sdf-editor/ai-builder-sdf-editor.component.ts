import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import {
  Subject,
  catchError,
  debounce,
  of,
  switchMap,
  takeUntil,
  timer,
} from "rxjs";

import {
  AiBuilderService,
  SDFIssue,
  SDFValidation,
} from "../ai-builder.service";

/** A validation problem shown in the gutter (1-indexed line). */
interface SDFError {
  line: number;
  message: string;
}

interface Match {
  start: number;
  end: number;
}

/**
 * Lightweight SDF text editor for the AI Builder right column.
 *
 * Binds `[value]` in and `(valueChange)` out so the parent's `worldSDF`
 * flows in and edits flow out unchanged. The viewport binding
 * (`[sdf]="worldSDF"`) means every keystroke re-renders the 3D scene;
 * this component is intentionally pass-through on edits.
 *
 * Errors and warnings in the gutter come from fuel-server's validator.
 *
 * Features:
 *   - line-number gutter on the left, scroll-synced with the textarea
 *     via a single scroll listener (no per-frame work)
 *   - case-insensitive substring search bar across the top with
 *     match count, prev/next navigation, and Enter to advance
 */
@Component({
  selector: "ai-builder-sdf-editor",
  templateUrl: "./ai-builder-sdf-editor.component.html",
  styleUrls: ["./ai-builder-sdf-editor.component.scss"],
  standalone: false,
})
export class AiBuilderSDFEditorComponent
  implements OnChanges, OnDestroy, AfterViewInit
{
  @Input() value = "";
  @Output() valueChange = new EventEmitter<string>();

  @ViewChild("ta", { static: false })
  ta?: ElementRef<HTMLTextAreaElement>;
  @ViewChild("gutter", { static: false })
  gutter?: ElementRef<HTMLDivElement>;

  searchQuery = "";
  matches: Match[] = [];
  currentMatch = -1;
  lineNumbers: number[] = [1];

  errors: SDFError[] = [];
  // Per-line lookup: which lines have at least one error, and what
  // tooltip text to show on hover. Built once per validate run so the
  // template's *ngFor doesn't pay for an array scan per gutter row.
  private errorByLine = new Map<number, string[]>();
  private validate$ = new Subject<{ text: string; immediate: boolean }>();
  private destroy$ = new Subject<void>();

  constructor(private service: AiBuilderService) {
    // Validation runs on fuel-server, the same validator the agent's
    // writes go through. Typing is debounced; switchMap drops responses
    // for text that has since changed.
    this.validate$
      .pipe(
        debounce(({ immediate }) => timer(immediate ? 0 : 400)),
        switchMap(({ text }) =>
          text.trim()
            ? this.service.validateSDF(text).pipe(catchError(() => of(null)))
            : of<SDFValidation>({ valid: true }),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe((result) => {
        if (result) this.setIssues(result.errors || [], result.warnings || []);
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["value"]) {
      this.recomputeLines();
      this.runSearch();
      // External value updates (agent edits, restoring a version)
      // validate immediately; there's no typing burst to coalesce.
      this.validate$.next({ text: this.value, immediate: true });
    }
  }

  ngAfterViewInit(): void {
    this.recomputeLines();
    this.validate$.next({ text: this.value, immediate: true });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onInput(next: string): void {
    this.value = next;
    this.valueChange.emit(next);
    this.recomputeLines();
    // Live search: update match positions/count as the user types.
    this.runSearch({ keepCursor: true });
    this.validate$.next({ text: next, immediate: false });
  }

  /** Total errors. Used by the badge in the search bar. */
  errorCountLabel(): string {
    if (!this.value.trim()) return "";
    if (this.errors.length === 0) return "Valid";
    return `${this.errors.length} ${this.errors.length === 1 ? "error" : "errors"}`;
  }

  /** True if the given 1-indexed line has at least one error. */
  lineHasError(line: number): boolean {
    return this.errorByLine.has(line);
  }

  /** Tooltip text for a line's gutter mark (newline-joined messages). */
  lineErrorMessages(line: number): string {
    return (this.errorByLine.get(line) || []).join("\n");
  }

  private setIssues(errors: SDFIssue[], warnings: SDFIssue[]): void {
    // Issues without a line (document-level) mark line 1 so they still
    // show in the gutter. The badge counts errors; the gutter shows both.
    const toLine = (i: SDFIssue, prefix = ""): SDFError => ({
      line: i.line || 1,
      message: prefix + i.message,
    });
    this.errors = errors.map((i) => toLine(i));
    const map = new Map<number, string[]>();
    for (const e of [
      ...this.errors,
      ...warnings.map((w) => toLine(w, "warning: ")),
    ]) {
      const list = map.get(e.line) || [];
      list.push(e.message);
      map.set(e.line, list);
    }
    this.errorByLine = map;
  }

  onScroll(): void {
    if (this.ta && this.gutter) {
      this.gutter.nativeElement.scrollTop = this.ta.nativeElement.scrollTop;
    }
  }

  onSearchInput(): void {
    this.runSearch();
  }

  next(event?: Event): void {
    event?.preventDefault();
    if (!this.matches.length) return;
    this.currentMatch = (this.currentMatch + 1) % this.matches.length;
    this.scrollToMatch();
  }

  prev(event?: Event): void {
    event?.preventDefault();
    if (!this.matches.length) return;
    this.currentMatch =
      (this.currentMatch - 1 + this.matches.length) % this.matches.length;
    this.scrollToMatch();
  }

  matchCountLabel(): string {
    if (!this.searchQuery) return "";
    if (!this.matches.length) return "No matches";
    return `${this.currentMatch + 1} of ${this.matches.length}`;
  }

  private recomputeLines(): void {
    const total = (this.value.match(/\n/g)?.length ?? 0) + 1;
    if (total === this.lineNumbers.length) return;
    this.lineNumbers = Array.from({ length: total }, (_, i) => i + 1);
  }

  /**
   * Recompute matches against the current value. With `keepCursor=true`
   * we leave the textarea selection alone (used while the user is
   * typing in the editor); otherwise we jump to the first match (used
   * when the user changes the search query itself).
   */
  private runSearch(opts: { keepCursor?: boolean } = {}): void {
    const q = this.searchQuery;
    if (!q) {
      this.matches = [];
      this.currentMatch = -1;
      return;
    }
    const haystack = this.value.toLowerCase();
    const needle = q.toLowerCase();
    const out: Match[] = [];
    let i = 0;
    while (true) {
      const at = haystack.indexOf(needle, i);
      if (at < 0) break;
      out.push({ start: at, end: at + needle.length });
      i = at + Math.max(needle.length, 1);
    }
    this.matches = out;
    if (!out.length) {
      this.currentMatch = -1;
      return;
    }
    if (!opts.keepCursor) {
      this.currentMatch = 0;
      this.scrollToMatch();
    } else if (this.currentMatch >= out.length) {
      this.currentMatch = out.length - 1;
    }
  }

  private scrollToMatch(): void {
    const m = this.matches[this.currentMatch];
    if (!m || !this.ta) return;
    const el = this.ta.nativeElement;
    el.focus({ preventScroll: false });
    // Setting the selection auto-scrolls the textarea so the caret is
    // on screen; this is the cheapest way to bring the match into view
    // without measuring line heights ourselves.
    el.setSelectionRange(m.start, m.end);
  }
}

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
import { Subject, debounceTime, takeUntil } from "rxjs";

import { SDFError, validateSDF } from "./sdf-validator";

interface Match {
  start: number;
  end: number;
}

/**
 * Lightweight SDF text editor for the AI Builder right column.
 *
 * Two-way binds via the `[(value)]` banana-in-box convention so the
 * parent's `worldSDF` flows in and edits flow out unchanged. The
 * existing viewport binding (`[sdf]="worldSDF"`) means every keystroke
 * re-renders the 3D scene; this component is intentionally pass-through
 * on edits so we don't insert debounce surprises here.
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
  private validate$ = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor() {
    // Debounce: validation parses XML, which is cheap-but-not-free for
    // multi-KB worlds. 200ms keeps it interactive while skipping work
    // mid-keystroke.
    this.validate$
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((text) => this.runValidation(text));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["value"]) {
      this.recomputeLines();
      this.runSearch();
      // External value updates (chat-engine sdf_update events,
      // restoring a version) should validate immediately rather than
      // waiting on the debounce — there's no typing burst to coalesce.
      this.runValidation(this.value);
    }
  }

  ngAfterViewInit(): void {
    this.recomputeLines();
    this.runValidation(this.value);
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
    this.validate$.next(next);
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

  private runValidation(text: string): void {
    this.errors = validateSDF(text);
    const map = new Map<number, string[]>();
    for (const e of this.errors) {
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

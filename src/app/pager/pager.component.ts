import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from "@angular/core";

@Component({
  selector: "gz-pager",
  templateUrl: "pager.component.html",
  styleUrls: ["pager.component.scss"],
  standalone: false,
})

/**
 * The Pager Component displays previous/next buttons with a row of page dots.
 *
 * Long page lists show a sliding window of dots around the current page,
 * plus a "page / count" label.
 */
export class PagerComponent implements OnChanges {
  /**
   * The current page, starting at 1.
   */
  @Input() public page: number = 1;

  /**
   * The total number of pages.
   */
  @Input() public pageCount: number = 0;

  /**
   * The maximum number of page dots to display at once.
   */
  @Input() public maxDots: number = 7;

  /**
   * Event emitted with the requested page number when the user changes pages.
   */
  @Output() public pageChange = new EventEmitter<number>();

  /**
   * The page numbers of the dots currently displayed.
   */
  public dots: number[] = [];

  /**
   * Recompute the visible dots when the inputs change.
   */
  public ngOnChanges(): void {
    const visible = Math.min(this.maxDots, this.pageCount);
    const first = Math.min(
      Math.max(1, this.page - Math.floor(visible / 2)),
      this.pageCount - visible + 1,
    );
    this.dots = Array.from({ length: visible }, (_, i) => first + i);
  }

  /**
   * Request a page change.
   *
   * @param page The page number to go to.
   */
  public goToPage(page: number): void {
    if (page >= 1 && page <= this.pageCount && page !== this.page) {
      this.pageChange.emit(page);
    }
  }
}

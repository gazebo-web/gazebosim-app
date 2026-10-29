import { Component, computed, input, output } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";

@Component({
  selector: "gz-pager",
  templateUrl: "pager.component.html",
  styleUrls: ["pager.component.scss"],
  imports: [MatIconModule],
})

/**
 * The Pager Component displays previous/next buttons with a row of page dots.
 *
 * Long page lists show a sliding window of dots around the current page,
 * plus a "page / count" label.
 */
export class PagerComponent {
  /**
   * The current page, starting at 1.
   */
  public page = input(1);

  /**
   * The total number of pages.
   */
  public pageCount = input(0);

  /**
   * The maximum number of page dots to display at once.
   */
  public maxDots = input(7);

  /**
   * Event emitted with the requested page number when the user changes pages.
   */
  public pageChange = output<number>();

  /**
   * The page numbers of the dots currently displayed, centered on the current
   * page where possible.
   */
  public dots = computed(() => {
    const pageCount = this.pageCount();
    const visible = Math.min(this.maxDots(), pageCount);
    const first = Math.min(
      Math.max(1, this.page() - Math.floor(visible / 2)),
      pageCount - visible + 1,
    );
    return Array.from({ length: visible }, (_, i) => first + i);
  });

  /**
   * Request a page change.
   *
   * @param page The page number to go to.
   */
  public goToPage(page: number): void {
    if (page >= 1 && page <= this.pageCount() && page !== this.page()) {
      this.pageChange.emit(page);
    }
  }
}

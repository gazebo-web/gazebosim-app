import { Component,
  EventEmitter,
  Input,
  Output,
  ElementRef,
  ChangeDetectorRef,
  ViewChild,
  AfterViewChecked } from '@angular/core';

import { FuelResource } from '../fuel-resource';

@Component({
selector: 'gz-fuel-resource-list',
templateUrl: 'fuel-resource-list.component.html',
styleUrls: ['fuel-resource-list.component.scss']
})

/**
 * The Fuel Resource List component is in charge of displaying a list of fuel resources.
 * It is meant to use as an element and not a page: It doesn't use a service.
 * It receives the resources to display as an input directive, and fires an event whenever
 * a scroll is detected, asking for more resources.
 */
export class FuelResourceListComponent implements AfterViewChecked {

  /**
   * Setter of the Resources. It is after their first change that we can determine to load
   * more resources or consider the infinite scroll to end.
   * A new array is required to trigger a change.
   */
  @Input() public set resources(res: FuelResource[]) {
    this._resources = res;
    this.loading = false;
    // Manually detect changes: This prevents ExpressionChangedAfterItHasBeenCheckedError.
    this.ref.detectChanges();
  }

  /**
   * Getter of the Resources.
   */
  public get resources(): FuelResource[] {
    return this._resources;
  }

  /**
   * The resource type this component is going to display.
   */
  @Input() public resourceType: string;

  /**
   * Enables or disables the scroll detection. Useful to control whether the output event
   * should be emitted or not.
   */
  @Input() public disabled: boolean = false;

  /**
   * Show or hide the loading animation.
   */
  @Input() public loading: boolean = false;

  /**
   * Indicates whether there are more resources to load or not.
   */
  @Input() public finished: boolean = false;

  /**
   * Whether the items on this list can be removed or not.
   */
  @Input() public removable: boolean = false;

  /**
   * Event emitter when the component needs more models to display.
   */
  @Output() public onLoadMore = new EventEmitter<any>();

  /**
   * Event emitter when a resource of the list needs to be removed.
   */
  @Output() public onRemoveItem = new EventEmitter<any>();

  /**
   * DOM element that contains the infinite scroll list.
   */
  @ViewChild('infiniteScroll') public listElement: ElementRef;

  /**
   * The array of resources that this component represents.
   */
  private _resources: FuelResource[];

  /**
   * @param ref Change detector ref to trigger repaint and get the correct element sizes.
   */
  constructor(public ref: ChangeDetectorRef) {
  }

  /**
   * After View Checked lifecycle hook.
   * See https://angular.io/guide/lifecycle-hooks#afterview
   *
   * Called after a change in a child's view.
   * The Infinite Scroll container won't work if it has no scrollbar.
   * To show a scrollbar, the height of the container should be larger than the window.
   * If the container is shorter, we ask for more resources until the container is longer, or
   * there are no more resources to show.
   */
  public ngAfterViewChecked(): void {
    const elementHeight = this.listElement.nativeElement.offsetHeight;
    const windowHeight = this.getWindowHeight();
    if (windowHeight > elementHeight && elementHeight !== 0) {
      this.loadMoreResources();
    }
  }

  /**
   * Callback for the Infinite Scroll component. Emits an event asking for more resources
   * to be loaded (only if there are more resources to load).
   */
  public onScroll(): void {
    this.loadMoreResources();
  }

  /**
   * Handle the loading of more resources by emitting the onLoadMore event only if it's not
   * loading already or there are no more resources to load.
   */
  public loadMoreResources(): void {
    if (!this.loading && !this.finished) {
      this.onLoadMore.emit();
      this.loading = true;
      // Manually detect changes: This prevents ExpressionChangedAfterItHasBeenCheckedError.
      this.ref.detectChanges();
    }
  }

  /**
   * Get the current Window's inner height.
   * This function means to make the testing easier, as the window is difficult to mock.
   *
   * @returns The height of the window.
   */
  public getWindowHeight(): number {
    return window.innerHeight;
  }

  /**
   * Callback of a remove event from a card. Re-emit it for the parent to handle it.
   *
   * @param event The remove event from the card.
   */
  public remove(event): void {
    this.onRemoveItem.emit(event);
  }
}

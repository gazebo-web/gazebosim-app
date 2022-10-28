import { Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import { PageEvent } from '@angular/material/paginator';
import { FuelResource } from '../fuel-resource';

@Component({
  selector: 'gz-fuel-resource-list',
  templateUrl: 'fuel-resource-list.component.html',
  styleUrls: ['fuel-resource-list.component.scss']
})

/**
 * The Fuel Resource List component is in charge of displaying a list of fuel resources.
 * It is meant to use as an element and not a page: It doesn't use a service.
 * It receives the resources to display as an input directive, and fires events related to
 * pagination.
 */
export class FuelResourceListComponent {

  /**
   * The total number of resources of the list.
   */
  @Input() public length: number;

  /**
   * Setter of the Resources.
   */
  @Input() public set resources(res: FuelResource[]) {
    this._resources = res;
    this.loading = false;
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
   * Event emitter when a page changes. Allows components to load the corresponding resources.
   */
  @Output() public pageChange = new EventEmitter<PageEvent>();

  /**
   * The array of resources that this component represents.
   */
  private _resources: FuelResource[];

  /**
   * Callback of a remove event from a card. Re-emit it for the parent to handle it.
   *
   * @param event The remove event from the card.
   */
  public remove(event): void {
    this.onRemoveItem.emit(event);
  }

  /**
   * Expose the pagination event to the parent component.
   *
   * @param event The pagination event.
   */
  public pageEvent(event: PageEvent): void {
    this.pageChange.emit(event);
  }
}

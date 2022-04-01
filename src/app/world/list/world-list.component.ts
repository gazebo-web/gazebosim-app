import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { World } from '../world';
import { WorldService } from '../world.service';
import { PaginatedWorlds } from '../paginated-worlds';

@Component({
  selector: 'gz-worlds',
  templateUrl: 'world-list.component.html',
  styleUrls: ['world-list.component.scss']
})

/**
 * World List Component is a page that displays a list of worlds.
 */
export class WorldListComponent implements OnInit {

  /**
   * The array of Worlds this component represents.
   */
  public worlds: World[];

  /**
   * The paginated Worlds returned from the Server.
   */
  public paginatedWorlds: PaginatedWorlds;

  /**
   * This component can display different kinds of lists depending on the route.
   * The title to display comes from the activated route's data.
   */
  public title: string;

  /**
   * @param activatedRoute The current Activated Route to get associated the data.
   * @param worldService Service used to get the paginated Worlds.
   */
  constructor(
    private activatedRoute: ActivatedRoute,
    private worldService: WorldService) {
  }

  /**
   * OnInit Lifecycle hook.
   *
   * It retrieves the list of worlds obtained from the Route Resolver.
   */
  public ngOnInit(): void {

    // Take the resources from the resolved data.
    this.paginatedWorlds = this.activatedRoute.snapshot.data['resolvedData'];
    this.worlds = this.paginatedWorlds.resources;

    // Evaluates the route's title.
    this.title = this.activatedRoute.snapshot.data['title'](this.activatedRoute);
  }

  /**
   * Callback to the onLoadMore event emitted by the Fuel Resource List Component.
   * The Fuel Resource List Component is asking for more resources to be load.
   */
  public loadNextPage(): void {
    if (this.paginatedWorlds.hasNextPage()) {
      this.worldService.getNextPage(this.paginatedWorlds).subscribe(
        (pagWorlds) => {
          this.paginatedWorlds = pagWorlds;
          // Copy and extend the existing array of models with the new ones.
          // A copy is required in order to trigger changes.
          const newWorlds = this.worlds.slice();
          for (const world of pagWorlds.resources) {
            newWorlds.push(world);
          }
          this.worlds = newWorlds;
        }
      );
    }
  }
}

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';

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
   * @param router The router used to call navigation methods.
   * @param worldService Service used to get the paginated Worlds.
   */
  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
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
   * Get new worlds when a pagination even occurs.
   *
   * @param event The Page Event emitted by the list's paginator.
   */
   public getWorlds(event: PageEvent) {
    this.worldService.getList({
      page: event.pageIndex + 1,
      per_page: event.pageSize,
    }).subscribe(
      (worlds) => {
        this.paginatedWorlds = worlds;
        this.worlds = this.paginatedWorlds.resources;

        // Navigate to the Worlds List page.
        // Note that this does not recreate the component, since the navigation is to the same page.
        this.router.navigateByUrl(`/worlds?page=${event.pageIndex+1}&per_page=${event.pageSize}`);
      }
    );
  }

}

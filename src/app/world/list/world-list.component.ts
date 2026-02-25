import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { PageEvent } from "@angular/material/paginator";

import { World } from "../world";
import { WorldService } from "../world.service";
import { PaginatedWorlds } from "../paginated-worlds";

@Component({
  selector: "gz-worlds",
  templateUrl: "world-list.component.html",
  styleUrls: ["world-list.component.scss"],
  standalone: false,
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
   * The current filter being used.
   */
  public currentFilter: string = "most_liked";

  /**
   * @param activatedRoute The current Activated Route to get associated the data.
   * @param router The router used to call navigation methods.
   * @param worldService Service used to get the paginated Worlds.
   */
  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private worldService: WorldService,
  ) {}

  /**
   * OnInit Lifecycle hook.
   *
   * It retrieves the list of worlds obtained from the Route Resolver.
   */
  public ngOnInit(): void {
    // Take the resources from the resolved data.
    this.paginatedWorlds = this.activatedRoute.snapshot.data["resolvedData"];
    this.worlds = this.paginatedWorlds.resources;

    // Evaluates the initial filter from the route's query params.
    if (this.activatedRoute.snapshot.queryParams["sort"]) {
      this.currentFilter = this.activatedRoute.snapshot.queryParams["sort"];
    } else if (!this.activatedRoute.snapshot.queryParams["q"]) {
      this.currentFilter = "most_liked";
    } else {
      this.currentFilter = "";
    }

    // Sort worlds locally as a fallback for backend sorting.
    this.sortWorlds();

    // Evaluates the route's title.
    this.title = this.activatedRoute.snapshot.data["title"](
      this.activatedRoute,
    );
  }

  /**
   * Get new worlds when a pagination even occurs.
   *
   * @param event The Page Event emitted by the list's paginator.
   */
  public getWorlds(event: PageEvent) {
    const params = {
      page: event.pageIndex + 1,
      per_page: event.pageSize,
    };
    if (this.currentFilter) {
      params["sort"] = this.currentFilter;
    }

    this.worldService.getList(params).subscribe((worlds) => {
      this.paginatedWorlds = worlds;
      this.worlds = this.paginatedWorlds.resources;

      // Sort worlds locally as a fallback for backend sorting.
      this.sortWorlds();

      // Navigate to the Worlds List page.
      // Note that this does not recreate the component, since the navigation is to the same page.
      let url = `/worlds?page=${event.pageIndex + 1}&per_page=${event.pageSize}`;
      if (this.currentFilter) {
        url += `&sort=${this.currentFilter}`;
      }
      this.router.navigateByUrl(url);
    });
  }

  /**
   * Called when a filter is selected.
   *
   * @param filter The filter to set.
   */
  public setFilter(filter: string): void {
    this.currentFilter = filter;
    this.getWorlds({
      pageIndex: 0,
      pageSize: 12,
      length: this.paginatedWorlds.totalCount,
    } as PageEvent);
  }

  /**
   * Sorts the current list of worlds based on the current filter.
   */
  private sortWorlds(): void {
    if (!this.worlds || !this.currentFilter) {
      return;
    }

    if (this.currentFilter === "most_liked") {
      this.worlds.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    } else if (this.currentFilter === "recent") {
      this.worlds.sort((a, b) => {
        const dateA = a.modifyDate ? new Date(a.modifyDate).getTime() : 0;
        const dateB = b.modifyDate ? new Date(b.modifyDate).getTime() : 0;
        return dateB - dateA;
      });
    } else if (this.currentFilter === "name") {
      this.worlds.sort((a, b) => {
        const nameA = (a.name || "").toLowerCase();
        const nameB = (b.name || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });
    }
  }
}

import { Component, OnInit } from "@angular/core";
import { PageEvent } from "@angular/material/paginator";
import { ActivatedRoute, Router } from "@angular/router";

import {
  Collection,
  CollectionService,
  PaginatedCollection,
} from "../../collection";

@Component({
  selector: "gz-collections",
  templateUrl: "collection-list.component.html",
  styleUrls: ["collection-list.component.scss"],
  standalone: false,
})

/**
 * Collection List Component is a page that displays a list of collections.
 */
export class CollectionListComponent implements OnInit {
  /**
   * The paginated Collection returned from the Server.
   */
  public paginatedCollections: PaginatedCollection;

  /**
   * The array of Collections this component represents.
   */
  public collections: Collection[];

  /**
   * The current filter being used.
   */
  public currentFilter: string = "most_liked";

  /**
   * @param router The router used to call navigation methods.
   * @param activatedRoute The current Activated Route to get associated the data.
   * @param collectionService Service used to get the collections.
   */
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private collectionService: CollectionService,
  ) {}

  /**
   * OnInit Lifecycle hook.
   *
   * It retrieves the list of collections obtained from the Route Resolver.
   */
  public ngOnInit(): void {
    // Take the resources from the resolved data.
    this.paginatedCollections =
      this.activatedRoute.snapshot.data["resolvedData"];
    this.collections = this.paginatedCollections.collections;

    // Evaluates the initial filter from the route's query params.
    if (this.activatedRoute.snapshot.queryParams["sort"]) {
      this.currentFilter = this.activatedRoute.snapshot.queryParams["sort"];
    } else if (!this.activatedRoute.snapshot.queryParams["q"]) {
      this.currentFilter = "most_liked";
    } else {
      this.currentFilter = "";
    }

    // Sort collections locally as a fallback for backend sorting.
    this.sortCollections();
  }

  /**
   * Get new models when a pagination even occurs.
   *
   * @param event The Page Event emitted by the list's paginator.
   */
  public getCollections(event: PageEvent) {
    const params = {
      page: event.pageIndex + 1,
      per_page: event.pageSize,
    };
    if (this.currentFilter) {
      params["sort"] = this.currentFilter;
    }

    this.collectionService
      .getCollectionList(params)
      .subscribe((collections) => {
        this.paginatedCollections = collections;
        this.collections = this.paginatedCollections.collections;

        // Sort collections locally as a fallback for backend sorting.
        this.sortCollections();

        // Navigate to the Collections List page.
        // Note that this does not recreate the component, since the navigation is to the same page.
        let url = `/collections?page=${event.pageIndex + 1}&per_page=${event.pageSize}`;
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
    this.getCollections({
      pageIndex: 0,
      pageSize: this.paginatedCollections.collections.length,
      length: this.paginatedCollections.totalCount,
    } as PageEvent);
  }

  /**
   * Sorts the current list of collections based on the current filter.
   */
  private sortCollections(): void {
    if (!this.collections || !this.currentFilter) {
      return;
    }

    // Note: Collections don't currently have a 'likes' field, so 'most_liked'
    // will leave the order as-is (default backend order).
    if (this.currentFilter === "recent") {
      this.collections.sort((a, b) => {
        const dateA = a.modifyDate ? new Date(a.modifyDate).getTime() : 0;
        const dateB = b.modifyDate ? new Date(b.modifyDate).getTime() : 0;
        return dateB - dateA;
      });
    } else if (this.currentFilter === "name") {
      this.collections.sort((a, b) => {
        const nameA = (a.name || "").toLowerCase();
        const nameB = (b.name || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });
    }
  }

  /**
   * Get the corresponding page title according to the route params.
   *
   * @returns The title to use.
   */
  public getTitle(): string {
    const owner: string = this.activatedRoute.snapshot.paramMap.get("user");
    if (owner) {
      return `${owner}'s collections`;
    }
    return "Latest collections";
  }
}

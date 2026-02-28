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
  }

  /**
   * Get new collections when a pagination event occurs.
   *
   * @param event The Page Event emitted by the list's paginator.
   */
  public getCollections(event: PageEvent) {
    const params = {
      page: event.pageIndex + 1,
      per_page: event.pageSize,
    };

    this.collectionService
      .getCollectionList(params)
      .subscribe((collections) => {
        this.paginatedCollections = collections;
        this.collections = this.paginatedCollections.collections;

        // Navigate to the Collections List page.
        // Note that this does not recreate the component, since the navigation is to the same page.
        const url = `/collections?page=${event.pageIndex + 1}&per_page=${event.pageSize}`;
        this.router.navigateByUrl(url);
      });
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

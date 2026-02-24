import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { PageEvent } from '@angular/material/paginator';

import { Collection, CollectionService, PaginatedCollection } from '../../collection';
import { FuelResourceListComponent } from 'src/app/fuel-resource';

@Component({
  selector: 'gz-collections',
  templateUrl: 'collection-list.component.html',
  styleUrls: ['collection-list.component.scss'],
  standalone: true,
  imports: [
    FlexLayoutModule,
    FuelResourceListComponent,
  ],
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
   * @param activatedRoute The current Activated Route to get associated the data.
   * @param collectionService Service used to get the collections.
   */
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private collectionService: CollectionService) {
  }

  /**
   * OnInit Lifecycle hook.
   *
   * It retrieves the list of collections obtained from the Route Resolver.
   */
  public ngOnInit(): void {
    // Take the resources from the resolved data.
    this.paginatedCollections = this.activatedRoute.snapshot.data['resolvedData'];
    this.collections = this.paginatedCollections.collections;
  }

  /**
   * Get new models when a pagination even occurs.
   *
   * @param event The Page Event emitted by the list's paginator.
   */
   public getCollections(event: PageEvent) {
    this.collectionService.getCollectionList({
      page: event.pageIndex + 1,
      per_page: event.pageSize,
    }).subscribe(
      (collections) => {
        this.paginatedCollections = collections;
        this.collections = this.paginatedCollections.collections;

        // Navigate to the Collections List page.
        // Note that this does not recreate the component, since the navigation is to the same page.
        this.router.navigateByUrl(`/collections?page=${event.pageIndex+1}&per_page=${event.pageSize}`);
      }
    );
  }

  /**
   * Get the corresponding page title according to the route params.
   *
   * @returns The title to use.
   */
  public getTitle(): string {
    const owner: string = this.activatedRoute.snapshot.paramMap.get('user');
    if (owner) {
      return `${owner}'s collections`;
    }
    return 'Latest collections';
  }
}

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Collection, CollectionService, PaginatedCollection } from '../../collection';

@Component({
  selector: 'ign-collections',
  templateUrl: 'collection-list.component.html',
  styleUrls: ['collection-list.component.scss']
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

  public loadNextCollectionsPage() {
    if (this.paginatedCollections.hasNextPage()) {
      this.collectionService.getNextPage(this.paginatedCollections).subscribe(
        (pagCollections) => {
          this.paginatedCollections = pagCollections;
          // Copy and extend the existing array of collections with the new ones.
          // A copy is required in order to trigger changes.
          const newCollections = this.collections.slice();
          for (const col of pagCollections.collections) {
            newCollections.push(col);
          }
          this.collections = newCollections;
        });
    }
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

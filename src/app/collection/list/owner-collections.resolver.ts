import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { Collection, CollectionService, PaginatedCollection } from '../../collection';

@Injectable()

/**
 * Resolver that fetches all collections of a certain owner.
 *
 * Fetches the collection to display before the CollectionListComponent is created.
 */
export class OwnerCollectionsResolver implements Resolve<PaginatedCollection> {

  /**
   * @param collectionService Service used to get Collection information from the Server.
   */
  constructor(private collectionService: CollectionService) {
  }

  /**
   * Resolve method.
   *
   * The list of Collections obtained is stored in the route's data, and can be accessed using the
   * router's ActivatedRoute.
   *
   * @param route A snapshot of the activated route.
   * @returns An observable of the collections or an observable of null if they couldn't be fetched.
   */
  public resolve(route: ActivatedRouteSnapshot): Observable<PaginatedCollection> {
    const owner: string = route.paramMap.get('user');

    return this.collectionService.getOwnerCollectionList(owner)
      .map((collections) => {
        return collections;
      })
      .catch(
        (err) => {
          return Observable.of(null);
      });
  }
}

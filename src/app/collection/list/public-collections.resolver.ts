import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { CollectionService, PaginatedCollection } from '../../collection';

@Injectable({
  providedIn: 'root',
})

/**
 * Resolver that fetches all public collections.
 *
 * Fetches the collection to display before the CollectionListComponent is created.
 */
export class PublicCollectionsResolver implements Resolve<PaginatedCollection> {

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

    const params = {};
    if (route.queryParams['q']) {
      params['search'] = route.queryParams['q'];
    }

    if (route.queryParams['page'] && route.queryParams['page'] > 0) {
      params['page'] = route.queryParams['page'];
    }

    if (route.queryParams['per_page']) {
      params['per_page'] = route.queryParams['per_page'];
    }

    return this.collectionService.getCollectionList(params).pipe(
      map((collections) => {
        return collections;
      }),
      catchError((err) => {
        return of(null);
      })
    );
  }
}

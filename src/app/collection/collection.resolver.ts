import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Collection, CollectionService } from '../collection';

@Injectable()

/**
 * Resolver for the :owner/collections/:collection route.
 *
 * Fetches the collection to display before the CollectionComponent is created.
 */
export class CollectionResolver implements Resolve<Collection> {

  /**
   * @param collectionService Service used to get Collection information from the Server.
   */
  constructor(private collectionService: CollectionService) {
  }

  /**
   * Resolve method.
   *
   * The Collection obtained is stored in the route's data, and can be accessed
   * using the router's ActivatedRoute.
   *
   * @param route A snapshot of the activated route.
   * @returns An observable of the collection or an observable of null if it couldn't be fetched.
   */
  public resolve(route: ActivatedRouteSnapshot): Observable<Collection> {
    const colOwner: string = route.paramMap.get('user');
    const colName: string = route.paramMap.get('collection');

    return this.collectionService.getCollection(colOwner, colName).pipe(
      catchError((err) => {
        return of(null);
      })
    );
  }
}

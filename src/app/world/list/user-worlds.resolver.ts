import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { PaginatedWorlds } from '../paginated-worlds';
import { WorldService } from '../world.service';

@Injectable({
  providedIn: 'root',
})

/**
 * Resolver that fetches the worlds that belong to a certain user.
 *
 * This allows us to have the list of worlds before it's displayed in a Component.
 */
export class UserWorldsResolver implements Resolve<PaginatedWorlds> {

  /**
   * @param worldService Service used to get World List information from the Server
   */
  constructor(private worldService: WorldService) {
  }

  /**
   * Resolve method.
   *
   * The list of Worlds obtained is stored in the route's data, and can be accessed using the
   * router's ActivatedRoute.
   *
   * @param route A snapshot of the activated route.
   * @returns An observable of the worlds or an observable of null if they couldn't be fetched.
   */
  public resolve(route: ActivatedRouteSnapshot): Observable<PaginatedWorlds> {

    const worldOwner: string = route.paramMap.get('owner');

    return this.worldService.getOwnerList(worldOwner).pipe(
      map((worlds) => {
        return worlds;
      }),
      catchError((err) => {
        return of(null);
      })
    );
  }
}

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
 * Resolver that fetches the worlds that a user liked.
 */
export class LikedWorldsResolver implements Resolve<PaginatedWorlds> {

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
    const user: string = route.paramMap.get('user');

    return this.worldService.getUserLikedList(user).pipe(
      map((worlds) => {
        return worlds;
      }),
      catchError((err) => {
        return of(null);
      })
    );
  }
}

import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { World } from './world';
import { WorldService } from './world.service';

@Injectable()

/**
 * Resolver for the :owner/worlds/:worldname route.
 *
 * Fetches the world to display before the WorldComponent is created.
 */
export class WorldResolver implements Resolve<World> {

  /**
   * @param worldService Service used to get World information from the Server.
   */
  constructor(private worldService: WorldService) {
  }

  /**
   * Resolve method.
   *
   * The World obtained is stored in the route's data, and can be accessed
   * using the router's ActivatedRoute.
   *
   * @param route A snapshot of the activated route.
   * @returns An observable of the world or an observable of null if it couldn't be fetched.
   */
  public resolve(route: ActivatedRouteSnapshot): Observable<World> {
    const worldOwner: string = route.paramMap.get('owner');
    const worldName: string = route.paramMap.get('worldname');

    return this.worldService.get(worldOwner, worldName).catch(
      (err) => {
        return Observable.of(null);
      });
  }
}

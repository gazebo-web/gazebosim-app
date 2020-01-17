import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { Portal, PortalService } from '../../portal';

@Injectable()

/**
 * Resolver that fetches all portals from the Server.
 *
 * Fetches the portals to display before the PortalListComponent is created.
 * TODO(german-mas): This resolver uses the singular Portal class. A Paginated one should be used.
 * See https://app.asana.com/0/851925973517080/909537141592497/f
 */
export class PortalListResolver implements Resolve<Portal> {

  /**
   * @param portalService Service used to get Portal information from the Server.
   */
  constructor(private portalService: PortalService) {
  }

  /**
   * Resolve method.
   *
   * The list of Portals obtained is stored in the route's data, and can be accessed using the
   * router's ActivatedRoute.
   *
   * @param route A snapshot of the activated route.
   * @returns An observable of the portals or an observable of null if they couldn't be fetched.
   */
  public resolve(route: ActivatedRouteSnapshot): Observable<Portal> {
    return this.portalService.getList()
      .map((portal) => {
        return portal;
      })
      .catch(
        (err) => {
          return Observable.of(null);
      });
  }
}

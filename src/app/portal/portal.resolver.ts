import { Injectable } from '@angular/core';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Portal } from './portal';
import { PortalService } from './portal.service';

@Injectable()

/**
 * Resolver for the :owner/portals/:portalname route.
 *
 * Fetches the model to display before the PortalComponent is created.
 */
export class PortalResolver implements Resolve<Portal> {

  /**
   * @param portalService Service used to get Portal information from the Server.
   */
  constructor(private portalService: PortalService) {
  }

  /**
   * Resolve method.
   *
   * The Portal obtained is stored in the route's data, and can be accessed
   * using the router's ActivatedRoute.
   *
   * @param route A snapshot of the activated route.
   * @returns An observable of the portal or an observable of null if it couldn't be fetched.
   */
  public resolve(route: ActivatedRouteSnapshot): Observable<Portal> {
    const portalOwner: string = route.paramMap.get('owner');
    const portalName: string = route.paramMap.get('portalname');

    // Route non-SubT portals to a 404 page.
    // TODO(german-mas): Remove this once portals come from the Server.
    // See https://app.asana.com/0/882898012818972/930885955659603/f
    if (portalOwner.toLowerCase() === 'darpa' && portalName.toLowerCase() === 'subt') {
      return this.portalService.get(portalOwner, portalName).pipe(
        catchError((err) => {
          return of(null);
        })
      );
    }
    return of(null);
  }
}
